import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Search, Plus, MessageSquare, Users, User, SlidersHorizontal, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE = "http://192.168.144.53:8000/api";

export default function MessagesScreen() {
  const router = useRouter();
  const { conversations, token, fetchConversations, user } = useApp() || {};
  const [tab, setTab] = useState('all chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (token && typeof fetchConversations === 'function') {
      fetchConversations(token);
    }
  }, [token]);

  // Хайлтын функц
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE}/chat/users/search/?search=${encodeURIComponent(query)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  // Хувийн чат үүсгэх эсвэл байгаа чат руу орох
  const startPrivateChat = async (targetUserId: number, targetName: string) => {
    try {
      const response = await fetch(`${API_BASE}/chat/rooms/private-create/`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: targetUserId })
      });

      const data = await response.json();
      
      if (response.ok && data.id) {
        setSearchQuery('');
        setSearchResults([]);
        // Нөгөө хүний нэрээр чат руу үсэрнэ
        router.push(`/chat/${data.id}?name=${targetName}` as any);
        if (typeof fetchConversations === 'function') fetchConversations(token);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    }
  };

const renderChatItem = ({ item }: { item: any }) => {
  const isSearchMode = searchQuery.length > 0;
  
  // 1. НЭРНИЙ ЛОГИКИЙГ САЙЖРУУЛАХ
  let displayName = item.name;

  if (isSearchMode) {
    // Хайлт хийж байгаа үед илэрц дээрх хүний нэр
    displayName = `${item.first_name} ${item.last_name || ''}`;
  } else if (item.is_group === false) {
    // ХУВИЙН ЧАТ бол: Өрөөний нэрийг үл хамааран нөгөө хүнийхээ нэрийг харуулна
    // users жагсаалтаас өөрийнхөө ID-тай тохирохгүй хүнийг хайх
    const otherParticipant = item.users?.find((u: any) => u.id !== user?.id);
    if (otherParticipant) {
      displayName = `${otherParticipant.first_name} ${otherParticipant.last_name || ''}`;
    }
  }

  const subText = isSearchMode ? item.email : (item.last_message?.text || 'Зурвас байхгүй...');
  const hasUnread = !isSearchMode && item.unread_count > 0;

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => isSearchMode 
        ? startPrivateChat(item.id, item.first_name) 
        : router.push(`/chat/${item.id}?name=${encodeURIComponent(displayName)}` as any)
      }
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <LinearGradient 
          colors={isSearchMode ? ['#818CF8', '#6366F1'] : ['#E0E7FF', '#C7D2FE']} 
          style={styles.avatar}
        >
          <Text style={[styles.avatarText, isSearchMode && {color: '#FFF'}]}>
            {displayName ? displayName[0].toUpperCase() : '?'}
          </Text>
        </LinearGradient>
        {!isSearchMode && item.is_online && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          {/* УНШААГҮЙ БОЛ МАШ ТОД БОЛГОХ */}
          <Text 
            style={[
              styles.chatName, 
              hasUnread ? { fontWeight: '900', color: '#0F172A', fontSize: 16 } : { color: '#334155' }
            ]} 
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {!isSearchMode && (
            <Text style={[styles.chatTime, hasUnread && {color: '#6366F1', fontWeight: '800'}]}>
              {item.last_message ? "саяхан" : ""}
            </Text>
          )}
        </View>
        <View style={styles.lastMsgRow}>
          <Text 
            style={[
              styles.lastMsg, 
              hasUnread ? { color: '#1E293B', fontWeight: '700' } : { color: '#64748B' }
            ]} 
            numberOfLines={1}
          >
            {subText}
          </Text>
          {hasUnread && (
             <View style={styles.unreadBadge}>
               <Text style={styles.badgeText}>{item.unread_count}</Text>
             </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.userSection}>
            <Image
              source={{ uri: user?.avatar || 'https://via.placeholder.com/100' }}
              style={styles.profileImg}
            />
            <View>
              <Text style={styles.greeting}>Сайн уу,</Text>
              <Text style={styles.name}>{user?.first_name || 'Хэрэглэгч'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <MessageSquare size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Хайх..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {setSearchQuery(''); setSearchResults([]);}}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal size={17} color="#fff" />
          </TouchableOpacity>
        </View>

        {!searchQuery && (
          <View style={styles.tabOuterContainer}>
            <View style={styles.tabContainer}>
              {['all chats', 'groups', 'contacts'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tab, tab === t && styles.activeTab]}
                  onPress={() => setTab(t)}
                >
                  <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
                    {t === 'all chats' ? 'Чат' : t === 'groups' ? 'Групп' : 'Хүмүүс'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={searchQuery ? searchResults : conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Чат олдсонгүй.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topSection: { backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, elevation: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  userSection: { flexDirection: 'row', alignItems: 'center' },
  profileImg: { width: 45, height: 45, borderRadius: 22, marginRight: 12 },
  greeting: { fontSize: 12, color: '#64748B' },
  name: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  iconBtn: { padding: 10, backgroundColor: '#F1F5F9', borderRadius: 12 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginVertical: 15 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 15, height: 45 },
  searchInput: { flex: 1, marginLeft: 10 },
  filterBtn: { width: 45, height: 45, backgroundColor: '#6366F1', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  tabOuterContainer: { paddingHorizontal: 20 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 15, padding: 5 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#6366F1' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  activeTabText: { color: '#FFF' },
  listContent: { padding: 15 },
  chatItem: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 10, alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 55, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#4F46E5' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 3, borderColor: '#FFF' },
  chatInfo: { flex: 1, marginLeft: 15 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  chatName: { fontSize: 16, fontWeight: '600', color: '#334155' },
  unreadTextBold: { fontWeight: '900', color: '#0F172A' },
  chatTime: { fontSize: 11, color: '#94A3B8' },
  lastMsgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg: { fontSize: 13, color: '#64748B', flex: 1 },
  unreadSubText: { color: '#1E293B', fontWeight: '700' },
  unreadBadge: { backgroundColor: '#6366F1', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8' }
});