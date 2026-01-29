

# Ivorian in Texas Community Platform

## Overview
A full-stack community platform built with Lovable Cloud featuring authentication, 6-tier role system, messaging, events, and notifications for the Ivorian community in Texas.

---

## Phase 1: Foundation & Authentication

### User Authentication
- Email/password signup and login
- Password reset functionality via email
- Email verification for new accounts
- Protected routes for authenticated users only

### User Profiles
- Profile creation on signup (name, bio, location, phone)
- Profile picture upload with storage
- View and edit own profile
- Public profile pages for community visibility

---

## Phase 2: Role-Based Access System

### 6-Tier Hierarchy
| Level | Role | Control | Permissions |
|-------|------|---------|-------------|
| 1-3 | Regular User | Basic | View content, message, attend events |
| 4 | Moderator | 30% | Approve posts, manage comments, view reports |
| 5 | Administrator | 60% | Manage users, create events, send announcements |
| 6 | Owner | 100% | Full control, manage admins, system settings |

### Admin Dashboard
- User management panel (view, edit roles, suspend)
- Content moderation tools
- Analytics overview (member count, activity)

---

## Phase 3: Community Features

### Member Directory
- Browse all community members
- Search by name, location, or interests
- "Connect" with other members
- Connection requests and acceptance flow

### Direct Messaging
- One-on-one messaging between members
- Conversation threads with history
- Unread message indicators
- Real-time message updates

---

## Phase 4: Events & News

### Events System
- Event listings with date, time, location, description
- Event search and filtering
- RSVP functionality
- Admin-only event creation

### News & Announcements
- Daily news subscription (opt-in)
- Admin broadcasts to all members
- News feed on homepage
- Category tagging (Community, Culture, Business, etc.)

---

## Phase 5: Notifications & Email

### In-App Notifications
- New message alerts
- Event reminders
- Admin announcements
- Connection requests

### Email Integration (Resend)
- Welcome email on signup
- Password reset emails
- Event reminder emails
- Admin newsletter broadcasts

---

## Database Structure

### Tables
- **profiles** - User details (name, bio, avatar, location)
- **user_roles** - Role assignments with level (1-6)
- **connections** - Member connections/friendships
- **messages** - Direct messages between users
- **conversations** - Message thread groupings
- **events** - Community events
- **event_rsvps** - Event attendance
- **news** - Announcements and articles
- **news_subscriptions** - Newsletter opt-ins
- **notifications** - In-app notifications

---

## Pages & Navigation

### Public Pages
- Landing page with community info
- Login / Signup

### Member Pages
- Dashboard (news feed, upcoming events)
- Member Directory
- Messages inbox
- Events calendar
- Profile settings
- Notifications

### Admin Pages
- Admin Dashboard
- User Management
- Event Management
- News/Announcement Creator
- Send Email Broadcasts

---

## Design Style
- Clean, modern interface
- Orange/green accents (Côte d'Ivoire colors)
- Mobile-responsive layout
- Community-focused imagery

