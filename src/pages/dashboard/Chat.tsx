import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquarePlus, Loader2, Paperclip, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_user_id: string;
  receiver_user_id: string;
  sent_at: string;
  application_id: string | null;
}

interface Contact {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  university_name?: string;
  profile_picture_url?: string | null;
  logo_url?: string | null;
}

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message: string | null;
  last_message_time: string | null;
  other_user?: Contact;
  application_id: string | null;
}

interface RelatedApplication {
  id: string;
  status: string;
  submitted_at: string | null;
  program_name: string;
  university_name?: string | null;
}

type FileMessageContent = {
  type: 'file';
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  bucket?: string;
  text?: string | null;
};

type ParsedMessageContent =
  | { type: 'text'; text: string }
  | FileMessageContent;

const CHAT_STORAGE_BUCKET = 'documents';

const Chat = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [view, setView] = useState<'contacts' | 'conversations'>('conversations');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [relatedApplications, setRelatedApplications] = useState<RelatedApplication[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { role, userData } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId && role) {
      loadConversations();
      loadContacts();
    }
  }, [currentUserId, role]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      const channel = subscribeToMessages(selectedConversation);
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedConversation) {
      setRelatedApplications([]);
      setSelectedApplicationId(null);
      return;
    }

    const conversation = conversations.find((conv) => conv.id === selectedConversation);
    if (!conversation) return;

    setSelectedApplicationId(conversation.application_id || null);
    loadRelatedApplications(conversation);
  }, [selectedConversation, conversations, role, userData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const parseMessageContent = (content: string): ParsedMessageContent => {
    try {
      const parsed = JSON.parse(content);
      if (parsed?.type === 'file' && (parsed.filePath || parsed.fileUrl) && parsed.fileName) {
        return {
          type: 'file',
          fileName: parsed.fileName,
          filePath: parsed.filePath,
          fileUrl: parsed.fileUrl,
          fileType: parsed.fileType,
          fileSize: parsed.fileSize,
          bucket: parsed.bucket,
          text: parsed.text ?? null,
        };
      }
    } catch (error) {
      // fallback to text
    }

    return { type: 'text', text: content };
  };

  const validateMessagePolicy = (text: string): string | null => {
    if (!text) return null;

    if (/@/.test(text)) {
      return 'Messages cannot include the @ symbol or contact details.';
    }

    if (/\d{5}/.test(text)) {
      return 'Messages cannot include sequences of 5 or more digits.';
    }

    return null;
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let current = size;
    while (current >= 1024 && index < units.length - 1) {
      current /= 1024;
      index += 1;
    }
    return `${current.toFixed(1)} ${units[index]}`;
  };

  const resolveProgramName = (program: any): string => {
    if (!program) return 'Application';
    const translations = program?.name?.translations as
      | Array<{ language_code: string; translated_text: string }>
      | undefined;
    if (translations?.length) {
      const english = translations.find((t) => t.language_code?.toLowerCase() === 'en');
      return english?.translated_text || translations[0]?.translated_text || 'Application';
    }
    return program?.name || 'Application';
  };

  const loadRelatedApplications = async (conversation: Conversation) => {
    if (!currentUserId) return;

    try {
      const otherUserId =
        conversation.participant_1_id === currentUserId
          ? conversation.participant_2_id
          : conversation.participant_1_id;

      const [{ data: otherStudent }, { data: currentStudent }] = await Promise.all([
        supabase.from('students').select('id, user_id').eq('user_id', otherUserId).maybeSingle(),
        supabase.from('students').select('id, user_id').eq('user_id', currentUserId).maybeSingle(),
      ]);

      const studentRecord = otherStudent || currentStudent;
      if (!studentRecord) {
        setRelatedApplications([]);
        return;
      }

      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          submitted_at,
          programs (
            id,
            university_id,
            universities (
              name
            ),
            name:translatable_strings!programs_name_id_fkey (
              translations (
                language_code,
                translated_text
              )
            )
          )
        `)
        .eq('student_id', studentRecord.id)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (role === 'university_official') {
        const officialData = userData as any;
        if (officialData?.university_id) {
          query = query.eq('programs.university_id', officialData.university_id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const normalized = (data || []).map((app: any) => ({
        id: app.id,
        status: app.status,
        submitted_at: app.submitted_at,
        program_name: resolveProgramName(app.programs),
        university_name: app.programs?.universities?.name ?? null,
      }));

      setRelatedApplications(normalized);
    } catch (error) {
      console.error('Error loading related applications:', error);
    }
  };

  const loadContacts = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      
      if (role === 'student') {
        console.log('Loading contacts for student...');
        // Students can see all university officials
        const { data, error } = await supabase
          .from('university_officials')
          .select(`
            user_id,
            university_id,
            users!inner (
              first_name,
              last_name,
              email,
              profile_picture_url
            )
          `);

        console.log('University officials data:', data);
        console.log('Error:', error);

        if (error) throw error;

        // Load university names and logos for each official
        const contactsWithUni = await Promise.all(
          (data || []).map(async (item: any) => {
            let universityName = 'University';
            let logoUrl = null;
            
            if (item.university_id) {
              const { data: uniData } = await supabase
                .from('universities')
                .select('name, logo_url')
                .eq('id', item.university_id)
                .maybeSingle();
              
              if (uniData) {
                universityName = uniData.name;
                logoUrl = uniData.logo_url;
              }
            }

            return {
              user_id: item.user_id,
              first_name: item.users.first_name,
              last_name: item.users.last_name,
              email: item.users.email,
              university_name: universityName,
              logo_url: logoUrl,
            };
          })
        );

        console.log('Formatted contacts:', contactsWithUni);
        setContacts(contactsWithUni);
      } else if (role === 'university_official' || role === 'administrator') {
        // University officials and administrators can reach any user in the system
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, profile_picture_url')
          .neq('id', currentUserId);

        if (error) throw error;

        const formattedContacts = (data ?? []).map((user) => ({
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          profile_picture_url: user.profile_picture_url,
        }));

        setContacts(formattedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${currentUserId},participant_2_id.eq.${currentUserId}`)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Load user details for each conversation
      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_1_id === currentUserId 
            ? conv.participant_2_id 
            : conv.participant_1_id;

          const { data: userData } = await supabase
            .from('users')
            .select('first_name, last_name, email, profile_picture_url')
            .eq('id', otherUserId)
            .single();
          
          // Check if user is a university official and get logo
          let logoUrl = null;
          if (userData) {
            const { data: officialData } = await supabase
              .from('university_officials')
              .select('university_id')
              .eq('user_id', otherUserId)
              .maybeSingle();
            
            if (officialData?.university_id) {
              const { data: uniData } = await supabase
                .from('universities')
                .select('logo_url')
                .eq('id', officialData.university_id)
                .maybeSingle();
              
              if (uniData) {
                logoUrl = uniData.logo_url;
              }
            }
          }

          return {
            ...conv,
            other_user: userData
              ? {
                  user_id: otherUserId,
                  ...userData,
                  logo_url: logoUrl,
                }
              : undefined,
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const incoming = payload.new as Message;
            if (prev.some((msg) => msg.id === incoming.id)) {
              return prev;
            }
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return channel;
  };

  const startConversation = async (contact: Contact) => {
    if (!currentUserId) return;

    // Check if conversation already exists
    const existingConv = conversations.find(
      (conv) =>
        (conv.participant_1_id === currentUserId && conv.participant_2_id === contact.user_id) ||
        (conv.participant_2_id === currentUserId && conv.participant_1_id === contact.user_id)
    );

    if (existingConv) {
      setSelectedConversation(existingConv.id);
      setSelectedContact(contact);
      setSelectedApplicationId(existingConv.application_id || null);
      setView('conversations');
      return;
    }

    // Create new conversation
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: currentUserId,
          participant_2_id: contact.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedConversation(data.id);
      setSelectedContact(contact);
      setSelectedApplicationId(data.application_id || null);
      setView('conversations');
      await loadConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !attachmentFile) || !selectedConversation || !currentUserId || sending)
      return;

    const conversation = conversations.find((c) => c.id === selectedConversation);
    if (!conversation) return;

    const receiverId =
      conversation.participant_1_id === currentUserId
        ? conversation.participant_2_id
        : conversation.participant_1_id;

    const trimmedMessage = newMessage.trim();
    const policyError = validateMessagePolicy(trimmedMessage);
    if (policyError) {
      toast({
        title: 'Message blocked',
        description: policyError,
        variant: 'destructive',
      });
      return;
    }

    let messageContent = trimmedMessage;
    let lastMessagePreview = trimmedMessage;

    try {
      setSending(true);

      if (attachmentFile) {
        const sanitizedName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `chat/${selectedConversation}/${Date.now()}-${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from(CHAT_STORAGE_BUCKET)
          .upload(filePath, attachmentFile, {
            contentType: attachmentFile.type || undefined,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(CHAT_STORAGE_BUCKET).getPublicUrl(filePath);

        if (!publicUrl) {
          throw new Error('Unable to generate attachment URL');
        }

        if (role === 'student') {
          try {
            const { error: watermarkError } = await supabase.functions.invoke('watermark_documents', {
              body: { bucket: CHAT_STORAGE_BUCKET, path: filePath },
            });
            if (watermarkError) {
              console.error('Failed to apply watermark to chat attachment', watermarkError);
            }
          } catch (error) {
            console.error('Failed to apply watermark to chat attachment', error);
          }
        }

        const payload: FileMessageContent = {
          type: 'file',
          fileName: attachmentFile.name,
          filePath,
          fileUrl: publicUrl,
          fileType: attachmentFile.type,
          fileSize: attachmentFile.size,
          bucket: CHAT_STORAGE_BUCKET,
          text: trimmedMessage || null,
        };

        messageContent = JSON.stringify(payload);
        lastMessagePreview = trimmedMessage || `📎 ${attachmentFile.name}`;
      }

      const { data: insertedMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation,
          sender_user_id: currentUserId,
          receiver_user_id: receiverId,
          content: messageContent,
          application_id: selectedApplicationId,
        })
        .select()
        .single();

      if (error) throw error;

      if (insertedMessage) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === insertedMessage.id)) {
            return prev;
          }
          return [...prev, insertedMessage as Message];
        });
      }

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message: lastMessagePreview,
          last_message_time: new Date().toISOString(),
          application_id: selectedApplicationId,
        })
        .eq('id', selectedConversation);

      setNewMessage('');
      setAttachmentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleApplicationLinkChange = async (value: string) => {
    if (!selectedConversation) return;
    const applicationId = value === 'none' ? null : value;
    setSelectedApplicationId(applicationId);

    try {
      await supabase
        .from('conversations')
        .update({ application_id: applicationId })
        .eq('id', selectedConversation);
      await loadConversations();
    } catch (error) {
      console.error('Error updating conversation application link:', error);
      toast({
        title: 'Error',
        description: 'Failed to update linked application',
        variant: 'destructive',
      });
    }
  };

  const navigateToApplication = (applicationId: string) => {
    if (!applicationId) return;
    navigate('/dashboard/applications', {
      state: { focusApplicationId: applicationId },
    });
  };

  const handleAttachmentOpen = async (file: FileMessageContent, messageId: string) => {
    try {
      setDownloadingAttachmentId(messageId);
      const bucket = file.bucket || CHAT_STORAGE_BUCKET;

      if (file.filePath) {
        const { data, error } = await supabase
          .storage
          .from(bucket)
          .createSignedUrl(file.filePath, 60);

        if (error) throw error;

        const url = data?.signedUrl;
        if (!url) throw new Error('Failed to generate download link');
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (file.fileUrl) {
        window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      throw new Error('Attachment reference not available');
    } catch (error) {
      console.error('Error opening attachment:', error);
      toast({
        title: 'Unable to open attachment',
        description: error instanceof Error ? error.message : 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const canSendMessage = (!!newMessage.trim() || !!attachmentFile) && !sending;

  const getDisplayName = (contact?: Contact) => {
    if (!contact) return 'Unknown';
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email;
  };

  const getInitials = (contact?: Contact) => {
    if (!contact) return '?';
    const firstName = contact.first_name || '';
    const lastName = contact.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || contact.email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Messages</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === 'contacts' ? 'conversations' : 'contacts')}
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            {view === 'contacts' ? 'Back to Chats' : 'New Chat'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
            <div className="border-r pr-4 flex flex-col h-full min-h-0">
              <h3 className="font-semibold mb-4">
                {view === 'contacts' ? 'Available Contacts' : 'Conversations'}
              </h3>
              <ScrollArea className="flex-1 min-h-0">
                {view === 'contacts' ? (
                  contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <div
                        key={contact.user_id}
                        className="p-3 cursor-pointer rounded-lg mb-2 hover:bg-muted flex items-center gap-3"
                        onClick={() => startConversation(contact)}
                      >
                        <Avatar>
                          <AvatarImage src={contact.logo_url || contact.profile_picture_url || undefined} alt={getDisplayName(contact)} />
                          <AvatarFallback>{getInitials(contact)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{getDisplayName(contact)}</p>
                          {contact.university_name && (
                            <p className="text-xs text-muted-foreground">{contact.university_name}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                      No contacts available
                    </p>
                  )
                ) : conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 cursor-pointer rounded-lg mb-2 flex items-center gap-3 ${
                        selectedConversation === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        setSelectedContact(conv.other_user || null);
                        setSelectedApplicationId(conv.application_id || null);
                      }}
                    >
                      <Avatar>
                        <AvatarImage src={conv.other_user?.logo_url || conv.other_user?.profile_picture_url || undefined} alt={getDisplayName(conv.other_user)} />
                        <AvatarFallback>{getInitials(conv.other_user)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{getDisplayName(conv.other_user)}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message || 'No messages yet'}
                        </p>
                        {conv.last_message_time && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.last_message_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center mt-8">
                    No conversations yet. Click "New Chat" to start one.
                  </p>
                )}
              </ScrollArea>
            </div>

            <div className="md:col-span-2 flex flex-col h-full min-h-0">
              {selectedConversation && selectedContact ? (
                <div className="flex flex-col h-full min-h-0">
                  <div className="flex items-center gap-3 pb-4 border-b mb-4">
                    <Avatar>
                      <AvatarImage src={selectedContact.logo_url || selectedContact.profile_picture_url || undefined} alt={getDisplayName(selectedContact)} />
                        <AvatarFallback>{getInitials(selectedContact)}</AvatarFallback>
                      </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{getDisplayName(selectedContact)}</p>
                      {selectedContact.university_name && (
                        <p className="text-sm text-muted-foreground">{selectedContact.university_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {relatedApplications.length > 0 ? (
                        <Select
                          value={selectedApplicationId ?? 'none'}
                          onValueChange={handleApplicationLinkChange}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Link to application" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No linked application</SelectItem>
                            {relatedApplications.map((app) => (
                              <SelectItem key={app.id} value={app.id}>
                                {app.program_name} ({app.status})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No related applications
                        </span>
                      )}
                      {selectedApplicationId && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigateToApplication(selectedApplicationId)}
                        >
                          Open
                        </Button>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <div className="px-4 py-2">
                      {messages.map((msg) => {
                        const parsed = parseMessageContent(msg.content);
                        const linkedApplication = msg.application_id
                          ? relatedApplications.find((app) => app.id === msg.application_id)
                          : null;

                        return (
                          <div
                            key={msg.id}
                            className={`mb-4 ${
                              msg.sender_user_id === currentUserId ? 'text-right' : 'text-left'
                            }`}
                          >
                            <div
                              className={`inline-block p-3 rounded-lg max-w-[70%] space-y-2 ${
                                msg.sender_user_id === currentUserId
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {parsed.type === 'file' ? (
                                <div className="space-y-2 text-left">
                                  {parsed.text && (
                                    <p className="whitespace-pre-wrap break-words">{parsed.text}</p>
                                  )}
                                  <div className="flex items-center gap-3 rounded-md border border-white/20 bg-background/30 px-3 py-2 text-left">
                                    <FileText className="h-4 w-4" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium break-words">{parsed.fileName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {parsed.fileType || 'Attachment'}
                                        {parsed.fileSize ? ` · ${formatFileSize(parsed.fileSize)}` : ''}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="text-xs"
                                      disabled={downloadingAttachmentId === msg.id}
                                      onClick={() => handleAttachmentOpen(parsed, msg.id)}
                                    >
                                      {downloadingAttachmentId === msg.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        'Open'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap break-words">{parsed.text}</p>
                              )}

                              {linkedApplication && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {linkedApplication.program_name}
                                  </Badge>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigateToApplication(linkedApplication.id)}
                                  >
                                    View application
                                  </Button>
                                </div>
                              )}

                              <p className="text-xs mt-1 opacity-70">
                                {new Date(msg.sent_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="mt-4 space-y-2">
                    {attachmentFile && (
                      <div className="flex items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{attachmentFile.name}</span>
                        <span className="text-xs">{formatFileSize(attachmentFile.size)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-7 w-7"
                          onClick={() => {
                            setAttachmentFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            setAttachmentFile(file);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attach
                      </Button>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (canSendMessage) sendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        disabled={sending}
                      />
                      <Button onClick={sendMessage} disabled={!canSendMessage}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {view === 'contacts' 
                    ? 'Select a contact to start messaging'
                    : 'Select a conversation or start a new chat'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;
