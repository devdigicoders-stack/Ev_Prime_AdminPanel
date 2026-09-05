import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Search, Send, Check, CheckCheck, MessageSquare } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// Connect to the root of the server
const SOCKET_URL = API_BASE.replace('/api', '');

const LiveChatView = () => {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Admin is using the panel, so we need some admin ID.
  // Since all admins and subadmins act as the same 'Support Team' for partners, 
  // we use the universal admin ID that the partner app sends messages to.
  const adminId = 'admin-123';  

  useEffect(() => {
    fetchPartners();
    
    // Initialize socket
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('connect', () => {
      console.log('Admin Socket connected');
      socketRef.current.emit('join_room', adminId);
    });

    socketRef.current.on('receive_message', (message) => {
      // If we receive a message from the currently selected partner
      setMessages((prev) => {
        // Only append if it belongs to the current chat
        if (
          (message.senderId === selectedPartner?._id && message.receiverId === adminId) ||
          (message.receiverId === selectedPartner?._id && message.senderId === adminId)
        ) {
          // If admin receives a message while looking at the chat, mark it as read
          if (message.senderId === selectedPartner?._id) {
            socketRef.current.emit('mark_read', {
              messageIds: [message._id],
              readerId: adminId,
              senderId: selectedPartner._id
            });
          }
          return [...prev, message];
        }
        return prev;
      });
      
      // If it's from a new partner, we might need to refresh the partners list
      fetchPartners();
    });

    socketRef.current.on('message_status_update', ({ messageId, status }) => {
      setMessages((prev) => 
        prev.map(msg => msg._id === messageId ? { ...msg, status } : msg)
      );
    });

    socketRef.current.on('messages_read_by_receiver', ({ messageIds }) => {
      setMessages((prev) => 
        prev.map(msg => messageIds.includes(msg._id) ? { ...msg, status: 'read' } : msg)
      );
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [selectedPartner]);

  useEffect(() => {
    if (selectedPartner) {
      fetchChatHistory(selectedPartner._id);
    }
  }, [selectedPartner]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchPartners = async () => {
    try {
      // For testing without auth middleware
      const res = await fetch(`${API_BASE}/chat/partners`);
      const json = await res.json();
      if (json.success) {
        setPartners(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch partners:', err);
    }
  };

  const fetchChatHistory = async (partnerId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/${partnerId}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
        
        // Mark unread messages from partner as read
        const unreadIds = json.data
          .filter(m => m.senderId === partnerId && m.status !== 'read')
          .map(m => m._id);
          
        if (unreadIds.length > 0) {
          socketRef.current.emit('mark_read', {
            messageIds: unreadIds,
            readerId: adminId,
            senderId: partnerId
          });
          
          setMessages(prev => prev.map(m => unreadIds.includes(m._id) ? { ...m, status: 'read' } : m));
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartner) return;

    const newMsg = {
      senderId: adminId,
      senderModel: 'User', // Admin is treated as User
      receiverId: selectedPartner._id,
      receiverModel: 'Partner',
      text: inputText,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };

    // Optimistic UI update
    // Real ID will come back via some ack or we can just let socket broadcast handle it
    // For simplicity, we just emit
    socketRef.current.emit('send_message', newMsg);
    
    // Add to UI temporarily with fake ID until status update
    setMessages(prev => [...prev, { ...newMsg, _id: Date.now().toString() }]);
    setInputText('');
  };

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.appUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-80px)] flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden m-4">
      {/* Sidebar - Partners List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Live Chat</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search partners..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#8CC63F] text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPartners.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No active chats found.</div>
          ) : (
            filteredPartners.map(partner => (
              <div 
                key={partner._id}
                onClick={() => setSelectedPartner(partner)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors flex items-center gap-3 ${
                  selectedPartner?._id === partner._id ? 'bg-[#8CC63F]/10 border-l-4 border-l-[#8CC63F]' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#8CC63F] text-white flex items-center justify-center font-bold text-lg">
                  {partner.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-gray-900 truncate">{partner.name}</h3>
                  <p className="text-xs text-gray-500 truncate">@{partner.appUsername}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#E5DDD5]">
        {selectedPartner ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 bg-white border-b border-gray-200 flex items-center gap-4 shadow-sm z-10">
              <div className="w-10 h-10 rounded-full bg-[#8CC63F] text-white flex items-center justify-center font-bold">
                {selectedPartner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selectedPartner.name}</h3>
                <p className="text-xs text-gray-500">@{selectedPartner.appUsername}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isAdmin = msg.senderModel === 'User';
                return (
                  <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[70%] min-w-[90px] rounded-2xl px-4 py-2 shadow-sm flex flex-col ${
                        isAdmin 
                          ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.text}</p>
                      <div className="flex justify-end items-center gap-1 mt-1">
                        <span className="text-[10px] text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isAdmin && (
                          <span className="ml-1">
                            {msg.status === 'sent' && <Check size={12} className="text-gray-400" />}
                            {msg.status === 'delivered' && <CheckCheck size={12} className="text-gray-400" />}
                            {msg.status === 'read' && <CheckCheck size={12} className="text-blue-500" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 border-none rounded-full px-6 py-3 focus:ring-2 focus:ring-[#8CC63F] transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-12 h-12 bg-[#8CC63F] text-white rounded-full flex items-center justify-center hover:bg-[#7ab133] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare size={64} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium">Select a partner to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChatView;
