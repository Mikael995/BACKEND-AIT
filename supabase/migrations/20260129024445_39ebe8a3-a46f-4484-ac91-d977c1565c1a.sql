-- Fix the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more restrictive INSERT policy - only admins can create notifications for any user
-- Users cannot create notifications for themselves (only the system/admins)
CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_above(auth.uid()));