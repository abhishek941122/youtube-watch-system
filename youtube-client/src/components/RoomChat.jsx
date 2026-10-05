import React, { useState, useEffect, useRef } from 'react';
import Card from './Card.jsx';
import Button from './Button.jsx';
import socket from '../services/socketService.js';
import { MessageSquare, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';

export const RoomChat = ({ roomId, localUsername = '' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!roomId) return;

    // Listen for room chat history
    const handleChatHistory = (data) => {
      if (Array.isArray(data?.messages)) {
        setMessages(data.messages);
      }
    };

    // Listen for new chat message
    const handleNewMessage = (msg) => {
      if (msg && msg.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    // Listen for chat errors (e.g. send failed)
    const handleChatError = (data) => {
      toast.error(data?.message || 'Failed to send message.');
    };

    socket.on('chat-history', handleChatHistory);
    socket.on('new-message', handleNewMessage);
    socket.on('chat-error', handleChatError);

    // Request chat history when component mounts
    socket.emit('get-chat-history', { roomId });

    return () => {
      socket.off('chat-history', handleChatHistory);
      socket.off('new-message', handleNewMessage);
      socket.off('chat-error', handleChatError);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();

    const trimmedText = input.trim();
    if (!trimmedText || !roomId || !localUsername) return;

    socket.emit('send-chat-message', {
      roomId,
      username: localUsername,
      text: trimmedText,
    });

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <Card
      title="Room Chat"
      subtitle={`${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`}
      headerAction={
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0" />
        </div>
      }
    >
      <div className="flex flex-col space-y-3">
        {/* Messages List Area */}
        <div className="h-[280px] sm:h-[320px] overflow-y-auto custom-scrollbar p-1 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-500 space-y-2 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80">
              <MessageSquare className="w-8 h-8 text-slate-600 mb-1" />
              <p className="text-xs font-semibold text-slate-400">No messages yet.</p>
              <p className="text-[11px] text-slate-500">Start the conversation with your watch party!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser =
                msg.username?.toLowerCase() === localUsername?.toLowerCase();

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isCurrentUser ? 'items-end' : 'items-start'
                  } animate-fade-in`}
                >
                  {/* Header: Sender & Time */}
                  <div className="flex items-center gap-1.5 px-1 mb-1 text-[10px] font-semibold text-slate-400">
                    <span className={isCurrentUser ? 'text-indigo-300 font-bold' : 'text-slate-300'}>
                      {isCurrentUser ? 'You' : msg.username}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">{formatTimestamp(msg.timestamp)}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3 text-xs sm:text-sm max-w-[85%] break-words shadow-md transition-all ${
                      isCurrentUser
                        ? 'bg-indigo-600/25 border border-indigo-500/40 text-white rounded-2xl rounded-tr-xs'
                        : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-2xl rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input & Send Form */}
        <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-800/90 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            aria-label="Room chat message input"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim()}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl shrink-0"
            aria-label="Send message"
            title="Send Message"
          >
            <SendHorizontal className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default RoomChat;
