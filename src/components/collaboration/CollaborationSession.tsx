import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Send,
  Search,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { realTimeCollaboration, CollaborationSession, CollaborationParticipant, CollaborationComment } from '@/lib/collaboration/RealTimeCollaboration';

interface CollaborationSessionProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  className?: string;
}

export const CollaborationSessionComponent: React.FC<CollaborationSessionProps> = ({
  sessionId,
  currentUserId,
  currentUserName,
  currentUserEmail,
  className = ""
}) => {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [participants, setParticipants] = useState<CollaborationParticipant[]>([]);
  const [comments, setComments] = useState<CollaborationComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [_isMuted, _setIsMuted] = useState(false);
  const [_isVideoOn, _setIsVideoOn] = useState(false);

  useEffect(() => {
    // Load session data
    const sessionData = realTimeCollaboration.getSession(sessionId);
    if (sessionData) {
      setSession(sessionData);
      setParticipants(sessionData.participants);
    }

    // Load comments
    const sessionComments = realTimeCollaboration.getSessionComments(sessionId);
    setComments(sessionComments);

    // Set up event listeners
    const handleUserJoined = (data: { sessionId: string; userId: string; userName: string }) => {
      if (data.sessionId === sessionId) {
        const updatedSession = realTimeCollaboration.getSession(sessionId);
        if (updatedSession) {
          setSession(updatedSession);
          setParticipants(updatedSession.participants);
        }
      }
    };

    const handleUserLeft = (data: { sessionId: string; userId: string }) => {
      if (data.sessionId === sessionId) {
        const updatedSession = realTimeCollaboration.getSession(sessionId);
        if (updatedSession) {
          setSession(updatedSession);
          setParticipants(updatedSession.participants);
        }
      }
    };

    const handleCommentAdded = (comment: CollaborationComment) => {
      if (comment.sessionId === sessionId) {
        setComments(prev => [...prev, comment]);
      }
    };

    const handleSearchShared = (data: { sessionId: string; userId: string; query: string; results: unknown[] }) => {
      if (data.sessionId === sessionId) {
        const updatedSession = realTimeCollaboration.getSession(sessionId);
        if (updatedSession) {
          setSession(updatedSession);
        }
      }
    };

    const handleConnected = () => {
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    // Register event listeners
    realTimeCollaboration.on('user_joined', handleUserJoined);
    realTimeCollaboration.on('user_left', handleUserLeft);
    realTimeCollaboration.on('comment_added', handleCommentAdded);
    realTimeCollaboration.on('search_shared', handleSearchShared);
    realTimeCollaboration.on('connected', handleConnected);
    realTimeCollaboration.on('disconnected', handleDisconnected);

    // Join the session
    realTimeCollaboration.joinSession(sessionId, currentUserId, currentUserName, currentUserEmail);

    return () => {
      // Cleanup
      realTimeCollaboration.off('user_joined', handleUserJoined);
      realTimeCollaboration.off('user_left', handleUserLeft);
      realTimeCollaboration.off('comment_added', handleCommentAdded);
      realTimeCollaboration.off('search_shared', handleSearchShared);
      realTimeCollaboration.off('connected', handleConnected);
      realTimeCollaboration.off('disconnected', handleDisconnected);
      realTimeCollaboration.leaveSession(sessionId, currentUserId);
    };
  }, [sessionId, currentUserId, currentUserName, currentUserEmail]);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;

    realTimeCollaboration.addComment(sessionId, currentUserId, currentUserName, newComment);
    setNewComment('');
  }, [sessionId, currentUserId, currentUserName, newComment]);

  const _handleShareSearch = useCallback((query: string, results: unknown[]) => {
    realTimeCollaboration.shareSearch(sessionId, currentUserId, query, results);
  }, [sessionId, currentUserId]);

  const handleInviteUser = useCallback(() => {
    const inviteLink = `${window.location.origin}/collaborate/${sessionId}`;
    navigator.clipboard.writeText(inviteLink);
    // Show toast notification
  }, [sessionId]);

  const _getParticipantRole = (userId: string): string => {
    const participant = participants.find(p => p.userId === userId);
    return participant?.role || 'viewer';
  };

  const _isOwner = session?.ownerId === currentUserId;
  const onlineParticipants = participants.filter(p => p.isOnline);

  if (!session) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading collaboration session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full bg-gray-50", className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{session.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-sm text-gray-600">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    {onlineParticipants.length} online
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleInviteUser}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {showParticipants ? "Hide" : "Show"} Participants
              </Button>
            </div>
          </div>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 p-6">
          {session.searchQuery ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Shared Search: &quot;{session.searchQuery}&quot;
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {session.searchResults?.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                      <h3 className="font-medium text-gray-900">{result.title || result.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{result.description || result.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{result.type || result.source}</Badge>
                        <span className="text-xs text-gray-500">
                          {result.date || result.createdAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No search shared yet</h3>
              <p className="text-gray-600">Share a search to start collaborating with your team</p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t bg-white">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Comments</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(false)}
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 max-h-64 overflow-y-auto">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {comment.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 min-h-[60px]"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participants Sidebar */}
      {showParticipants && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 300 }}
          exit={{ width: 0 }}
          className="border-l bg-white"
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Participants</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowParticipants(false)}
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {participants.map((participant) => (
              <div key={participant.userId} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                    participant.isOnline ? "bg-green-500" : "bg-gray-400"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {participant.name}
                    </p>
                    {participant.userId === currentUserId && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={participant.role === 'owner' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {participant.role}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {participant.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CollaborationSessionComponent;
