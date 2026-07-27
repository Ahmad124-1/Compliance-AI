import { Bell, Calendar, MessageSquare, AlertTriangle, BarChart3, Users, Siren } from 'lucide-react';

export const COMMUNICATION_ROUTES = {
  hub: '/communication-hub',
  inbox: '/communication-hub/inbox',
  chat: '/communication-hub/chat',
  broadcasts: '/communication-hub/broadcasts',
  emergency: '/communication-hub/emergency',
  calendar: '/communication-hub/calendar',
  analytics: '/communication-hub/analytics',
  manager: '/communication-hub/manager',
};

export const COMMUNICATION_ICONS = {
  hub: MessageSquare,
  inbox: Bell,
  chat: MessageSquare,
  broadcasts: Bell,
  emergency: Siren,
  calendar: Calendar,
  analytics: BarChart3,
  manager: Users,
};

export const EMERGENCY_TYPES = [
  { value: 'fire', label: 'Fire' },
  { value: 'medical', label: 'Medical' },
  { value: 'chemical_spill', label: 'Chemical Spill' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'evacuation', label: 'Evacuation' },
  { value: 'weather', label: 'Weather' },
  { value: 'security', label: 'Security Incident' },
];

export const BROADCAST_TYPES = [
  { value: 'company', label: 'Company Broadcast' },
  { value: 'department', label: 'Department Broadcast' },
  { value: 'factory', label: 'Factory Broadcast' },
  { value: 'emergency', label: 'Emergency Alert' },
  { value: 'hr', label: 'HR Message' },
  { value: 'compliance', label: 'Compliance Message' },
  { value: 'training', label: 'Training Announcement' },
  { value: 'audit', label: 'Audit Announcement' },
];

export const MESSAGE_CATEGORIES = [
  { value: 'company', label: 'Company' },
  { value: 'department', label: 'Department' },
  { value: 'factory', label: 'Factory' },
  { value: 'hr', label: 'HR' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'training', label: 'Training' },
  { value: 'audit', label: 'Audit' },
  { value: 'emergency', label: 'Emergency' },
];

export const CHANNEL_TYPES = [
  { value: 'in_app', label: 'In-App' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'push', label: 'Push Notification' },
];
