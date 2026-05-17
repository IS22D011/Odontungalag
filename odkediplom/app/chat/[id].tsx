import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, 
  StatusBar, Modal, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, ChevronLeft, Info, X, Paperclip } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

// Мессежийн төрөл
interface Message {
  id: any;
  room: number;
  sender: number;
  sender_name: string;
  text: string;
  timestamp: string;
  sending?: boolean;
}

export default function ChatRoomScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const { token, user, BASE_URL } = useApp() as any;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // 1. Мессежүүдийг татах
  const fetchMessages = useCallback(async () => {
    if (!token || !id) return;
    try {
      const response = await fetch(`${BASE_URL}/chat/rooms/${id}/messages/`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // 2. Мессеж илгээх болон засах
  const handleSendMessage = async () => {
    if (!inputText.trim() || !token || !user) return;

    const currentText = inputText;
    setInputText('');

    if (editingMsg) {
      try {
        const response = await fetch(`${BASE_URL}/chat/messages/${editingMsg.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ text: currentText }),
        });
        if (response.ok) {
          setEditingMsg(null);
          fetchMessages();
        }
      } catch (e) { Alert.alert("Алдаа", "Засаж чадсангүй"); }
    } else {
      const tempId = `temp-${Date.now()}`;
      const newMessage: Message = {
        id: tempId,
        room: Number(id),
        sender: user.id,
        sender_name: user.first_name || user.username,
        text: currentText,
        timestamp: new Date().toISOString(),
        sending: true
      };

      setMessages(prev => [...prev, newMessage]);
      
      try {
        const response = await fetch(`${BASE_URL}/chat/rooms/${id}/send_message/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ text: currentText }),
        });

        if (response.ok) {
          const savedMsg = await response.json();
          setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
        } else {
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }
      } catch (error) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    }
  };

  // Мессеж устгах
  const deleteMsg = async (msgId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/chat/messages/${msgId}/`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch (error) { console.error("Delete error:", error); }
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    const isMe = user?.id && Number(item.sender) === Number(user.id);
    const isSameUser = index > 0 && messages[index - 1].sender === item.sender;
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.msgRow, isMe ? styles.myMsgRow : styles.theirMsgRow, isSameUser && { marginTop: 2 }]}>
        {!isMe && !isSameUser && (
          <View style={styles.avatarCircle}>
             <Text style={styles.avatarInitial}>{item.sender_name[0]}</Text>
          </View>
        )}
        <View style={[styles.bubbleContainer, isMe ? { alignItems: 'flex-end' } : { marginLeft: isSameUser ? 40 : 0 }]}>
          {!isMe && !isSameUser && <Text style={styles.senderNameLabel}>{item.sender_name}</Text>}
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => {
              if (isMe) { setSelectedMsg(item); setShowMenu(true); }
            }}
            style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
          >
            <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>{item.text}</Text>
            <Text style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}>{time}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={28} color="#1E293B" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Active now</Text>
          </View>
        </View>

        {/* Group Detail руу үсрэх хэсэг - Энийг зассан */}
        <TouchableOpacity 
          style={styles.infoBtn}
          onPress={() => router.push({
            pathname: "/chat/group/[id]",
            params: { id: id, name: name }
          } as any)}
        >
          <Info size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {editingMsg && (
          <View style={styles.editBar}>
            <View style={styles.editInfo}>
              <Text style={styles.editLabel}>Editing Message</Text>
              <Text style={styles.editPreview} numberOfLines={1}>{editingMsg.text}</Text>
            </View>
            <TouchableOpacity onPress={() => { setEditingMsg(null); setInputText(''); }}>
              <X size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachBtn}>
              <Paperclip size={22} color="#64748B" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Aa"
              value={inputText}
              onChangeText={setInputText}
              multiline
              placeholderTextColor="#94A3B8"
            />
          </View>
          <TouchableOpacity 
            onPress={handleSendMessage} 
            disabled={!inputText.trim()}
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
          >
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.sendGradient}>
              <Send size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
                setEditingMsg(selectedMsg); setInputText(selectedMsg?.text || ''); setShowMenu(false);
            }}>
              <Text style={styles.menuText}>Засах</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => {
                if (selectedMsg) deleteMsg(selectedMsg.id); setShowMenu(false);
            }}>
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Устгах</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, 
    paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9'
  },
  backBtn: { padding: 4 },
  headerTitleBox: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 4 },
  statusText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  infoBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },

  listContent: { paddingHorizontal: 16, paddingVertical: 20 },
  msgRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
  myMsgRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  theirMsgRow: { alignSelf: 'flex-start' },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 8, alignSelf: 'flex-end' },
  avatarInitial: { fontSize: 12, fontWeight: '800', color: '#4F46E5' },
  bubbleContainer: { flex: 1 },
  senderNameLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 4, marginLeft: 4 },
  bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  myBubble: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  msgText: { fontSize: 15, lineHeight: 22 },
  myText: { color: '#FFF' },
  theirText: { color: '#1E293B' },
  timeText: { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  theirTime: { color: '#94A3B8' },

  inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 25, paddingHorizontal: 12, marginRight: 12 },
  attachBtn: { padding: 10 },
  textInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#1E293B', maxHeight: 100 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  editBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#EEF2FF', borderTopWidth: 1, borderColor: '#6366F1' },
  editInfo: { flex: 1 },
  editLabel: { fontSize: 11, fontWeight: '800', color: '#6366F1' },
  editPreview: { fontSize: 13, color: '#475569' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuBox: { width: 220, backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden' },
  menuItem: { padding: 18, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { fontSize: 16, fontWeight: '600' }
});