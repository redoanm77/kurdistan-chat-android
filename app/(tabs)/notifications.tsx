import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from "react-native";
import { collection, getDocs, query, where, orderBy, limit, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: any;
  fromName: string;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "notifications"),
        where("toUid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "friend_request": return "person-add";
      case "message": return "chatbubble";
      case "like": return "heart";
      default: return "notifications";
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.read && styles.unread]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon(item.type) as any} size={22} color="#7c3aed" />
      </View>
      <View style={styles.notifContent}>
        <Text style={styles.notifMessage}>{item.message}</Text>
        <Text style={styles.notifTime}>
          {item.createdAt?.toDate?.()?.toLocaleDateString("ar") || ""}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        <Text style={styles.count}>
          {notifications.filter(n => !n.read).length} جديد
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#333" />
            <Text style={styles.empty}>لا توجد إشعارات</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, paddingTop: 50,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  count: { color: "#7c3aed", fontSize: 15 },
  list: { padding: 16 },
  notifCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a1a2e", borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: "#2a2a3e",
  },
  unread: { borderColor: "#7c3aed", backgroundColor: "#1e1a2e" },
  iconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#2a1a4e", justifyContent: "center", alignItems: "center",
    marginRight: 12,
  },
  notifContent: { flex: 1 },
  notifMessage: { color: "#fff", fontSize: 14 },
  notifTime: { color: "#666", fontSize: 12, marginTop: 4 },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: "#7c3aed",
  },
  emptyContainer: { alignItems: "center", marginTop: 80 },
  empty: { color: "#666", fontSize: 16, marginTop: 16 },
});
