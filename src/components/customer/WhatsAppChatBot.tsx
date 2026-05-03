// src/components/customer/WhatsAppChatBot.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Check, CheckCheck, Loader2, IndianRupee, MapPin, FileText, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { OrderStatus } from '@prisma/client';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  type?: 'text' | 'status' | 'payment' | 'location' | 'invoice' | 'location_request';
  data?: any;
}

interface WhatsAppChatBotProps {
  order: any;
}

export default function WhatsAppChatBot({ order }: WhatsAppChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Simulate bot conversation based on order status
    const sequence: Message[] = [
      {
        id: '1',
        text: `Hi ${order.user.name.split(' ')[0]}! 🌟 I'm your Deeshora assistant.`,
        sender: 'bot',
        timestamp: new Date(order.createdAt),
        type: 'text'
      },
      {
        id: '2',
        text: `I've received your order #${order.id.slice(-8).toUpperCase()} from *${order.vendor.shopName}*.`,
        sender: 'bot',
        timestamp: new Date(new Date(order.createdAt).getTime() + 1000),
        type: 'text'
      }
    ];

    if (order.status !== 'PENDING') {
      sequence.push({
        id: '3',
        text: `Great news! The shop has confirmed your order.`,
        sender: 'bot',
        timestamp: new Date(new Date(order.createdAt).getTime() + 5000),
        type: 'status'
      });
    }

    if (order.status === 'READY' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
      sequence.push({
        id: '4',
        text: `Your items are ready and packed! 🛍️`,
        sender: 'bot',
        timestamp: new Date(new Date(order.createdAt).getTime() + 10000),
        type: 'text'
      });
    }

    if (order.status === 'OUT_FOR_DELIVERY') {
      sequence.push({
        id: '5',
        text: `Our delivery partner is on the way to your location. 🛵`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'location'
      });
    }

    if (order.status === 'DELIVERED') {
      sequence.push({
        id: '6',
        text: `Order Delivered! Hope you enjoy your purchase. 🙏`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    }

    if (order.paymentStatus === 'PAID') {
      sequence.push({
        id: 'invoice_msg',
        text: `Your payment of ₹${order.total} is confirmed! 🧾`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'invoice'
      });
    } else if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
      sequence.push({
        id: 'loc_request',
        text: `Please share your delivery location for faster delivery! 📍`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'location_request'
      });
    }

    setMessages(sequence);
  }, [order.status, order.paymentStatus, order.id, order.user.name, order.vendor.shopName, order.createdAt, order.total]);

  const handleShareLocation = async () => {
    try {
      setIsTyping(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;
      
      const newMsg: Message = {
        id: `user_loc_${Date.now()}`,
        text: `Shared my location: https://www.google.com/maps?q=${latitude},${longitude}`,
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, newMsg]);
      setIsTyping(false);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `bot_ack_${Date.now()}`,
          text: `Thank you! 📍 We've updated your delivery partner with the exact location.`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        }]);
      }, 1000);
      
      toast.success('Location shared with delivery partner!');
    } catch (err) {
      toast.error('Could not get location. Please check permissions.');
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-[#efe7dd] rounded-[2rem] overflow-hidden border border-gray-200 shadow-xl flex flex-col h-[500px] relative">
      {/* WhatsApp Header */}
      <div className="bg-[#075e54] p-4 flex items-center gap-3 text-white">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <MessageCircle size={20} fill="currentColor" />
        </div>
        <div>
          <p className="font-black text-sm tracking-tight">Deeshora Assistant</p>
          <p className="text-[10px] text-emerald-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> online
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <div className="flex justify-center">
          <span className="bg-[#dcf8c6] text-[10px] font-bold text-gray-500 px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm">
            Today
          </span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative ${
                msg.sender === 'user' 
                ? 'bg-[#dcf8c6] rounded-tr-none' 
                : 'bg-white rounded-tl-none'
              }`}>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>{line}<br/></span>
                  ))}
                </p>
                
                {msg.type === 'payment' && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                      <IndianRupee size={14} className="text-emerald-600" />
                      Pending: ₹{order.total}
                    </div>
                    <button className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Pay
                    </button>
                  </div>
                )}

                {msg.type === 'invoice' && (
                  <div className="mt-2 flex flex-col gap-2">
                    <Link 
                      href={`/orders/${order.id}/invoice`}
                      className="flex items-center justify-center gap-2 bg-emerald-500 text-white p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      <FileText size={14} /> View Invoice
                    </Link>
                  </div>
                )}

                {msg.type === 'location_request' && (
                  <div className="mt-2">
                    <button 
                      onClick={handleShareLocation}
                      className="w-full flex items-center justify-center gap-2 bg-[#075e54] text-white p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#128c7e] transition-colors shadow-sm"
                    >
                      <MapPin size={14} /> Share My Location
                    </button>
                  </div>
                )}

                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-[9px] text-gray-400">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'bot' && <CheckCheck size={12} className="text-blue-400" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area (Fake) */}
      <div className="bg-white p-3 flex items-center gap-2">
        <div className="flex-1 bg-gray-100 h-10 rounded-full px-4 flex items-center text-gray-400 text-xs italic">
          Type a message...
        </div>
        <div className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white">
          <MessageCircle size={20} />
        </div>
      </div>
    </div>
  );
}
