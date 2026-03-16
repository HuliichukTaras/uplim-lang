"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Send,
  ArrowLeft,
  X,
  FileText,
  Loader2,
  MoreVertical,
  Trash2,
  Search,
  ImageIcon,
  UserPlus,
  UserCheck,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { formatDistanceToNow, format } from "date-fns"
import { upload } from "@vercel/blob/client"

type Profile = {
  id: string
  display_name: string | null
  handle: string
  avatar_url: string | null
  bio?: string | null
  created_at?: string
}

type Attachment = {
  type: "image" | "file" | "video"
  url: string
  name: string
  size: number
  mimeType: string
}

type Message = {
  id: string
  content: string
  attachments: Attachment[] | null
  created_at: string
  sender_id: string
  sender: Profile
  deleted_for_everyone?: boolean
}

type Conversation = {
  id: string
  lastMessageAt: string
  otherUser: Profile
  lastMessage: {
    content: string
    attachments?: Attachment[] | null
    created_at: string
    sender_id: string
  } | null
  unreadCount: number
  status?: string
  isRequest?: boolean
}

export default function MessagesClient({
  currentUserId,
  initialRecipient,
}: {
  currentUserId: string
  initialRecipient: Profile | null
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conversationsLoaded, setConversationsLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null)
  const [followersCount, setFollowersCount] = useState<number>(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const hasAutoSelectedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()

  const selectedConv = conversations.find((c) => c.id === selectedConversation)
  const isNewConversation = selectedConversation?.startsWith("new:")

  useEffect(() => {
    loadConversations()

    const messagesChannel = supabase
      .channel("user-messages")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events including UPDATE
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newMsg = payload.new as any

            // If deleted for everyone, update local state
            if (newMsg.deleted_for_everyone) {
              setMessages((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, deleted_for_everyone: true } : m)))
              return
            }

            // Handle new messages logic...
            if (payload.eventType === "INSERT") {
              await loadConversations()
              if (selectedConversation && newMsg.conversation_id === selectedConversation) {
                const { data } = await supabase
                  .from("messages")
                  .select(`
                      *,
                      sender:profiles!sender_id(id, handle, display_name, avatar_url)
                    `)
                  .eq("id", newMsg.id)
                  .single()

                if (data) {
                  setMessages((prev) => {
                    if (prev.some((m) => m.id === data.id)) return prev
                    return [...prev, data as Message]
                  })
                }
              }
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [selectedConversation])

  useEffect(() => {
    if (conversationsLoaded && initialRecipient && !hasAutoSelectedRef.current) {
      const existingConv = conversations.find((c) => c.otherUser.id === initialRecipient.id)

      if (existingConv) {
        setSelectedConversation(existingConv.id)
      } else {
        setSelectedConversation("new:" + initialRecipient.id)
        // Clear messages for new conversation
        setMessages([])
      }
      hasAutoSelectedRef.current = true
    }
  }, [conversationsLoaded, initialRecipient, conversations])

  useEffect(() => {
    if (selectedConversation && !selectedConversation.startsWith("new:")) {
      loadMessages(selectedConversation)
    } else if (selectedConversation?.startsWith("new:")) {
      setMessages([])
    }
  }, [selectedConversation])

  useEffect(() => {
    async function loadRecipientProfile() {
      if (!selectedConversation) {
        setRecipientProfile(null)
        return
      }

      const recipientId = isNewConversation ? selectedConversation.replace("new:", "") : selectedConv?.otherUser.id

      if (!recipientId) return

      try {
        // Fetch full profile with bio and created_at
        const { data: fullProfile } = await supabase
          .from("profiles")
          .select("id, display_name, handle, avatar_url, bio, created_at")
          .eq("id", recipientId)
          .maybeSingle()

        if (fullProfile) {
          setRecipientProfile(fullProfile)

          // Fetch followers count
          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", fullProfile.id)

          setFollowersCount(count || 0)

          const { count: isFollowingCount } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", currentUserId)
            .eq("following_id", fullProfile.id)

          setIsFollowing(!!isFollowingCount)
        }
      } catch (error) {
        console.error("Error loading recipient profile:", error)
      }
    }

    loadRecipientProfile()
  }, [selectedConversation, isNewConversation, selectedConv?.otherUser.id, currentUserId])

  async function loadConversations() {
    try {
      const response = await fetch("/api/conversations")
      const data = await response.json()
      const allConversations = [...(data.conversations || []), ...(data.requests || [])]
      setConversations(allConversations)
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
    } finally {
      setConversationsLoaded(true)
    }
  }

  async function loadMessages(conversationId: string) {
    const response = await fetch(`/api/messages/${conversationId}`)
    const data = await response.json()
    setMessages(data.messages || [])
  }

  async function handleStartConversation(recipient: Profile) {
    const existingConv = conversations.find((c) => c.otherUser.id === recipient.id)
    if (existingConv) {
      setSelectedConversation(existingConv.id)
      return
    }

    setSelectedConversation("new:" + recipient.id)
    setMessages([])
    setAttachments([])
    setNewMessage("")
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files))
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault()
      await processFiles(Array.from(e.clipboardData.files))
    }
  }

  const processFiles = async (files: File[]) => {
    setIsUploading(true)
    try {
      const newAttachments: Attachment[] = []

      for (const file of files) {
        if (file.size > 100 * 1024 * 1024) {
          // Increased limit for videos
          alert(`File ${file.name} is too large (max 100MB)`)
          continue
        }

        const uniqueFilename = `${Date.now()}-${file.name}`

        // This replaces the direct POST to /api/upload which was limited to 4.5MB
        const newBlob = await upload(uniqueFilename, file, {
          access: "public",
          handleUploadUrl: "/api/upload/token",
        })

        newAttachments.push({
          type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file", // Add video type detection
          url: newBlob.url,
          name: file.name, // Keep original name for display
          size: file.size,
          mimeType: file.type,
        })
      }

      setAttachments((prev) => [...prev, ...newAttachments])
    } catch (error) {
      console.error("Error uploading file:", error)
      let errorMessage = "Failed to upload file"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = String((error as any).message)
      }
      alert(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSendMessage() {
    if ((!newMessage.trim() && attachments.length === 0) || isUploading) return

    setLoading(true)

    try {
      let recipientId: string
      let conversationId: string | null = selectedConversation

      if (selectedConversation?.startsWith("new:")) {
        recipientId = selectedConversation.replace("new:", "")
        conversationId = null
      } else {
        const conv = conversations.find((c) => c.id === selectedConversation)
        if (!conv) return
        recipientId = conv.otherUser.id
      }

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          content: newMessage,
          attachments,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewMessage("")
        setAttachments([])

        if (!conversationId) {
          setSelectedConversation(data.conversationId)
          await loadConversations()
        } else {
          if (data.message) {
            // We need to construct the full message object with sender info to match the type
            // The API response returns the message record, but we need the sender profile too.
            // Since we are the sender, we can assume current user info, but the API response might just be the raw row.
            // Ideally, we fetch it or construct it.
            // However, to be safe and consistent, we can rely on the realtime event BUT
            // the user said it "doesn't appear immediately".
            // So we MUST add it here.
            // Let's create a temporary message object or use the one from API if it has sender expanded (it likely doesn't).
            // We'll construct it using our known currentUserId. Since we don't have our own profile in props easily (except initialRecipient which is the other person),
            // we might miss our own avatar in this optimistic update if we don't fetch it.
            // BUT: MessagesClient doesn't receive the full current user profile, only ID.
            // Wait, we can fetch the message with sender from Supabase immediately here instead of waiting for realtime.

            const { data: fullMessage } = await supabase
              .from("messages")
              .select(`
                      *,
                      sender:profiles!sender_id(id, handle, display_name, avatar_url)
                    `)
              .eq("id", data.message.id)
              .single()

            if (fullMessage) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === fullMessage.id)) return prev
                return [...prev, fullMessage as Message]
              })
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteMessage(messageId: string, mode: "me" | "everyone") {
    try {
      // Optimistic update
      if (mode === "me") {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      } else {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted_for_everyone: true } : m)))
      }

      const response = await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, mode }),
      })

      if (!response.ok) {
        // Revert on error (reload messages)
        console.error("Failed to delete message")
        if (selectedConversation) loadMessages(selectedConversation)
      }
    } catch (error) {
      console.error("Error deleting message:", error)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleToggleFollow() {
    if (!recipientProfile || isFollowLoading) return

    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch("/api/follow", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: recipientProfile.id }),
        })
        if (response.ok) {
          setIsFollowing(false)
          setFollowersCount((prev) => Math.max(0, prev - 1))
        }
      } else {
        // Follow
        const response = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: recipientProfile.id }),
        })
        if (response.ok) {
          setIsFollowing(true)
          setFollowersCount((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  let recipientForNew = null
  if (isNewConversation && initialRecipient) {
    recipientForNew = initialRecipient
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const displayName = (conv.otherUser.display_name || "").toLowerCase()
    const handle = conv.otherUser.handle.toLowerCase()
    return displayName.includes(query) || handle.includes(query)
  })

  const displayProfile = recipientProfile || selectedConv?.otherUser || recipientForNew

  return (
    <div className="flex h-[calc(100vh-64px)] max-w-[1200px] mx-auto">
      {/* LEFT SIDEBAR - Conversations List */}
      <div className={`w-full md:w-80 border-r flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b space-y-3">
          <h2 className="text-xl font-semibold">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search Direct Messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition border-b ${
                selectedConversation === conv.id ? "bg-muted" : ""
              }`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                <AvatarFallback>{conv.otherUser.display_name?.[0] || conv.otherUser.handle[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{conv.otherUser.display_name || conv.otherUser.handle}</p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage.sender_id === currentUserId ? "You: " : ""}
                    {conv.lastMessage.content ||
                      (conv.lastMessage.attachments?.length ? "📷 Attachment" : "Sent a message")}
                  </p>
                )}
              </div>
            </button>
          ))}
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No conversations found" : "No messages yet"}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Conversation View */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          <div className="border-b">
            <div className="p-4 flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {displayProfile && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={displayProfile.avatar_url || undefined} alt="Avatar" />
                    <AvatarFallback>
                      {displayProfile.display_name?.[0]?.toUpperCase() ||
                        displayProfile.handle[0]?.toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold truncate">{displayProfile.display_name || displayProfile.handle}</p>
                        <p className="text-sm text-muted-foreground truncate">@{displayProfile.handle}</p>
                      </div>
                      {displayProfile.id !== currentUserId && (
                        <Button
                          variant={isFollowing ? "outline" : "default"}
                          size="sm"
                          onClick={handleToggleFollow}
                          disabled={isFollowLoading || !recipientProfile}
                          className="ml-2"
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {displayProfile && recipientProfile && (
              <div className="pb-8 space-y-4 text-center border-b mb-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={displayProfile.avatar_url || undefined} alt="Avatar" />
                  <AvatarFallback className="text-2xl">
                    {displayProfile.display_name?.[0]?.toUpperCase() || displayProfile.handle[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-xl">{displayProfile.display_name || displayProfile.handle}</p>
                  <p className="text-muted-foreground">@{displayProfile.handle}</p>
                </div>

                {recipientProfile.bio && <p className="text-foreground/90 max-w-md mx-auto">{recipientProfile.bio}</p>}

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  {recipientProfile.created_at && (
                    <span>Joined {format(new Date(recipientProfile.created_at), "MMMM yyyy")}</span>
                  )}
                  <span className="font-medium">
                    {followersCount} {followersCount === 1 ? "Follower" : "Followers"}
                  </span>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"} group relative`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 space-y-2 ${
                    msg.sender_id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"
                  } ${msg.deleted_for_everyone ? "italic opacity-80" : ""}`}
                >
                  {msg.deleted_for_everyone ? (
                    <p className="text-sm">This message was deleted</p>
                  ) : (
                    <>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2">
                          {msg.attachments.map((att, i) => {
                            const isVideo =
                              att.type === "video" ||
                              att.mimeType?.startsWith("video/") ||
                              /\.(mp4|mov|webm|mkv)$/i.test(att.url) ||
                              /\.(mp4|mov|webm|mkv)$/i.test(att.name)

                            return (
                              <div key={i} className="rounded-lg overflow-hidden">
                                {att.type === "image" && !isVideo ? (
                                  <a href={att.url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={att.url || "/placeholder.svg"}
                                      alt={att.name}
                                      className="max-w-full rounded-lg max-h-[300px] object-cover"
                                    />
                                  </a>
                                ) : isVideo ? (
                                  <video controls src={att.url} className="max-w-full rounded-lg max-h-[300px]" />
                                ) : (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 bg-background/10 rounded-lg hover:bg-background/20 transition"
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="text-sm truncate max-w-[200px]">{att.name}</span>
                                  </a>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                    </>
                  )}
                  <p
                    className={`text-xs mt-1 ${msg.sender_id === currentUserId ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>

                {!msg.deleted_for_everyone && (
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={msg.sender_id === currentUserId ? "end" : "start"}>
                        <DropdownMenuItem
                          onClick={() => handleDeleteMessage(msg.id, "me")}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete for me
                        </DropdownMenuItem>
                        {msg.sender_id === currentUserId && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(msg.id, "everyone")}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete for everyone
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Area */}
          <div className="p-4 border-t space-y-4">
            {attachments.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {attachments.map((att, i) => (
                  <div key={i} className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                      {att.type === "image" ? (
                        <img
                          src={att.url || "/placeholder.svg"}
                          alt={att.name}
                          className="w-full h-full object-cover"
                        />
                      ) : att.type === "video" || att.mimeType?.startsWith("video/") ? (
                        <video src={att.url} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
                accept="image/*,video/*"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || loading}
                className="text-primary hover:bg-primary/10"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  onPaste={handlePaste}
                  placeholder="Start a new message"
                  disabled={loading}
                  className="min-h-[44px] rounded-full bg-muted/50"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={loading || (!newMessage.trim() && attachments.length === 0) || isUploading}
                size="icon"
                className="rounded-full h-10 w-10"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
          Select a conversation to start messaging
        </div>
      )}
    </div>
  )
}
