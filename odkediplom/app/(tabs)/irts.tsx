import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Calendar, Clock, Check, X } from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";

interface LeaveRequest {
    id: number;
    user_name: string;
    department: string;
    start_date: string;
    end_date: string;
    day_count: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    leave_type: string;
}

export default function LeaveRequestsScreen() {
    const { token } = useApp() as any;
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [filter, setFilter] = useState<'pending' | 'history'>('pending');

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            // URL-ийг өөрийнхөөрөө солиорой. EXPO_PUBLIC_API_URL ажиллахгүй бол шууд IP бичээрэй.
            const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://192.168.144.53:8000";
            const response = await fetch(`${baseUrl}/api/hr/leaves/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setRequests(data);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://192.168.144.53:8000";
            const response = await fetch(`${baseUrl}/api/hr/leaves/${id}/approve/`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                Alert.alert("Амжилттай", status === 'approved' ? "Зөвшөөрлөө" : "Татгалзлаа");
                fetchRequests(); // Жагсаалтыг шинэчлэх
            }
        } catch (error) {
            Alert.alert("Алдаа", "Хүсэлтийг шийдвэрлэхэд алдаа гарлаа.");
        }
    };

    const renderItem = ({ item }: { item: LeaveRequest }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.user_name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.user_name}</Text>
                        <Text style={styles.deptName}>{item.department}</Text>
                    </View>
                </View>
                <View style={styles.sickBadge}>
                    <Text style={styles.sickText}>{item.leave_type.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Calendar size={16} color="#64748B" />
                    <Text style={styles.infoText}>{item.start_date} - {item.end_date}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Clock size={16} color="#64748B" />
                    <Text style={styles.infoText}>Өдрийн тоо: {item.day_count}</Text>
                </View>
            </View>

            <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={[styles.btn, styles.rejectBtn]} 
                    onPress={() => handleAction(item.id, 'rejected')}
                >
                    <X size={18} color="#EF4444" />
                    <Text style={styles.rejectBtnText}>Татгалзах</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btn, styles.approveBtn]} 
                    onPress={() => handleAction(item.id, 'approved')}
                >
                    <Check size={18} color="#10B981" />
                    <Text style={styles.approveBtnText}>Зөвшөөрөх</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Чөлөөний хүсэлтүүд</Text>
                <Text style={styles.subtitle}>Программ хангамж хөгжүүлэлтийн хэлтэс • Менежер</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, filter === 'pending' && styles.activeTab]} 
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.tabText, filter === 'pending' && styles.activeTabText]}>Хүлээгдэж буй</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, filter === 'history' && styles.activeTab]} 
                    onPress={() => setFilter('history')}
                >
                    <Text style={[styles.tabText, filter === 'history' && styles.activeTabText]}>Түүх</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={requests.filter(r => filter === 'pending' ? r.status === 'pending' : r.status !== 'pending')}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 20 : 40 },
    title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
    subtitle: { fontSize: 13, color: '#64748B', marginTop: 5 },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E2E8F0' },
    activeTab: { backgroundColor: '#6366F1' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    activeTabText: { color: '#FFF' },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { 
        backgroundColor: '#FFF', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 3 }
        })
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    userName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    deptName: { fontSize: 12, color: '#94A3B8' },
    sickBadge: { backgroundColor: '#F43F5E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    sickText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    infoRow: { flexDirection: 'row', gap: 20, marginBottom: 15 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 13, color: '#475569', fontWeight: '500' },
    reasonBox: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, marginBottom: 15 },
    reasonText: { fontSize: 13, color: '#475569', fontStyle: 'italic' },
    actionButtons: { flexDirection: 'row', gap: 12 },
    btn: { 
        flex: 1, 
        flexDirection: 'row', 
        height: 44, 
        borderRadius: 12, 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 6,
        borderWidth: 1
    },
    rejectBtn: { borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
    approveBtn: { borderColor: '#DCFCE7', backgroundColor: '#F0FDF4' },
    rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
    approveBtnText: { color: '#10B981', fontWeight: '700', fontSize: 14 }
});