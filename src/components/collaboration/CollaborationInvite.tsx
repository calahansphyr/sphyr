import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Copy,
  Mail,
  MessageSquare,
  Link,
  X,
  Check,
  Users,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CollaborationInviteProps {
  sessionId: string;
  sessionName: string;
  ownerName: string;
  onClose: () => void;
  onInviteSent?: (inviteData: InviteData) => void;
  className?: string;
}

interface InviteData {
  emails: string[];
  role: 'collaborator' | 'viewer';
  message: string;
  expiresAt?: string;
}

interface SuggestedContact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastCollaborated?: string;
  isOnline: boolean;
}

export const CollaborationInvite: React.FC<CollaborationInviteProps> = ({
  sessionId,
  sessionName,
  ownerName: _ownerName,
  onClose,
  onInviteSent,
  className = ""
}) => {
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'collaborator' | 'viewer'>('collaborator');
  const [inviteMessage, setInviteMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<'email' | 'link'>('email');

  // Mock suggested contacts - in a real app, this would come from your user's contacts
  const suggestedContacts: SuggestedContact[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      lastCollaborated: '2 hours ago',
      isOnline: true
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      lastCollaborated: '1 day ago',
      isOnline: false
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@company.com',
      lastCollaborated: '3 days ago',
      isOnline: true
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david.kim@company.com',
      lastCollaborated: '1 week ago',
      isOnline: false
    }
  ];

  const inviteLink = `${window.location.origin}/collaborate/${sessionId}`;

  const handleAddEmail = () => {
    if (emailInput.trim() && !inviteEmails.includes(emailInput.trim())) {
      setInviteEmails([...inviteEmails, emailInput.trim()]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

  const handleAddSuggestedContact = (contact: SuggestedContact) => {
    if (!inviteEmails.includes(contact.email)) {
      setInviteEmails([...inviteEmails, contact.email]);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleSendInvites = () => {
    if (inviteEmails.length === 0) return;

    const inviteData: InviteData = {
      emails: inviteEmails,
      role: selectedRole,
      message: inviteMessage,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    // In a real application, this would send the invites via email
    console.log('Sending invites:', inviteData);
    
    onInviteSent?.(inviteData);
    onClose();
  };

  const getRoleDescription = (role: 'collaborator' | 'viewer'): string => {
    switch (role) {
      case 'collaborator':
        return 'Can search, comment, and modify shared content';
      case 'viewer':
        return 'Can view and comment on shared content';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", className)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Invite to Collaboration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Invite team members to join &quot;{sessionName}&quot;
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Invite Method Selection */}
          <div className="mb-6">
            <div className="flex gap-2">
              <Button
                variant={inviteMethod === 'email' ? 'default' : 'outline'}
                onClick={() => setInviteMethod('email')}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Invites
              </Button>
              <Button
                variant={inviteMethod === 'link' ? 'default' : 'outline'}
                onClick={() => setInviteMethod('link')}
                className="flex-1"
              >
                <Link className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </div>
          </div>

          {inviteMethod === 'email' ? (
            <>
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission Level
                </label>
                <Select value={selectedRole} onValueChange={(value: 'collaborator' | 'viewer') => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collaborator">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Collaborator</div>
                          <div className="text-xs text-gray-500">Can search, comment, and modify</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Viewer</div>
                          <div className="text-xs text-gray-500">Can view and comment only</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {getRoleDescription(selectedRole)}
                </p>
              </div>

              {/* Email Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Addresses
                </label>
                <div className="flex gap-2">
                  <Input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email address"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  />
                  <Button onClick={handleAddEmail} disabled={!emailInput.trim()}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Added Emails */}
                {inviteEmails.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {inviteEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <span className="text-sm text-gray-700">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmail(email)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested Contacts */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggested Contacts
                </label>
                <div className="space-y-2">
                  {suggestedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddSuggestedContact(contact)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {contact.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                            contact.isOnline ? "bg-green-500" : "bg-gray-400"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Last collaborated</p>
                        <p className="text-xs text-gray-700">{contact.lastCollaborated}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <Textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  rows={3}
                />
              </div>
            </>
          ) : (
            /* Share Link Method */
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Collaboration Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Collaboration Link
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={inviteLink}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          onClick={handleCopyLink}
                          variant={copied ? "default" : "outline"}
                          className="flex items-center gap-2"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">How it works</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Anyone with this link can join the collaboration session. 
                            They&apos;ll be added as viewers by default, but you can promote them to collaborators.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {inviteMethod === 'email' ? (
              <span>{inviteEmails.length} {inviteEmails.length === 1 ? 'person' : 'people'} will be invited</span>
            ) : (
              <span>Link expires in 7 days</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {inviteMethod === 'email' ? (
              <Button 
                onClick={handleSendInvites}
                disabled={inviteEmails.length === 0}
              >
                Send Invites
              </Button>
            ) : (
              <Button onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CollaborationInvite;
