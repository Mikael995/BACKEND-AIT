-- Create role level enum for 6-tier hierarchy
CREATE TYPE public.user_role_level AS ENUM ('level_1', 'level_2', 'level_3', 'moderator', 'administrator', 'owner');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  interests TEXT[] DEFAULT '{}',
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_level user_role_level NOT NULL DEFAULT 'level_1',
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Create connections table (member friendships)
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (requester_id, receiver_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_two UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (participant_one, participant_two)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  image_url TEXT DEFAULT '',
  category TEXT DEFAULT 'community',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_rsvps table
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- Create news table
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  category TEXT DEFAULT 'community' CHECK (category IN ('community', 'culture', 'business', 'announcement', 'other')),
  image_url TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT true,
  is_broadcast BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_subscriptions table
CREATE TABLE public.news_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'connection', 'event', 'announcement', 'system')),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check role level
CREATE OR REPLACE FUNCTION public.get_user_role_level(_user_id UUID)
RETURNS user_role_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role_level FROM public.user_roles WHERE user_id = _user_id),
    'level_1'::user_role_level
  );
$$;

-- Create function to check if user is moderator or above (level 4+)
CREATE OR REPLACE FUNCTION public.is_moderator_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role_level IN ('moderator', 'administrator', 'owner')
  );
$$;

-- Create function to check if user is admin or above (level 5+)
CREATE OR REPLACE FUNCTION public.is_admin_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role_level IN ('administrator', 'owner')
  );
$$;

-- Create function to check if user is owner (level 6)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role_level = 'owner'
  );
$$;

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_moderator_or_above(auth.uid()));

CREATE POLICY "Owners can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "Admins can manage non-owner roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (
  public.is_admin_or_above(auth.uid()) 
  AND role_level NOT IN ('owner', 'administrator')
);

-- Connections policies
CREATE POLICY "Users can view their connections"
ON public.connections FOR SELECT TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can request connections"
ON public.connections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they received"
ON public.connections FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own connections"
ON public.connections FOR DELETE TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
);

-- Events policies
CREATE POLICY "Published events are viewable by all authenticated users"
ON public.events FOR SELECT TO authenticated
USING (is_published = true OR public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admins can create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE TO authenticated
USING (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- Event RSVPs policies
CREATE POLICY "Users can view event RSVPs"
ON public.event_rsvps FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can RSVP to events"
ON public.event_rsvps FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their RSVPs"
ON public.event_rsvps FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their RSVPs"
ON public.event_rsvps FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- News policies
CREATE POLICY "Published news is viewable by all authenticated users"
ON public.news FOR SELECT TO authenticated
USING (is_published = true OR public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admins can create news"
ON public.news FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admins can update news"
ON public.news FOR UPDATE TO authenticated
USING (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admins can delete news"
ON public.news FOR DELETE TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- News subscriptions policies
CREATE POLICY "Users can view their subscription"
ON public.news_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their subscription"
ON public.news_subscriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their subscription"
ON public.news_subscriptions FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role_level)
  VALUES (NEW.id, 'level_1');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX idx_connections_receiver_id ON public.connections(receiver_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_news_created_at ON public.news(created_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);