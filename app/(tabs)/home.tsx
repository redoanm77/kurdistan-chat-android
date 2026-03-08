import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, RefreshControl,
} from "react-native";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface UserItem {
  uid: string;
  displayName: string;
  photoURL: string;
  isOnline: boolean;
  points: number;
}

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserItem[]>([]);
  const [topUsers, setTopUsers] = useState<UserItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // المتواجدون الآن
      const onlineQ = query(
        collection(db, "users"),
        where("isOnline", "==", true),
        limit(20)
      );
      const onlineSnap = await getDocs(onlineQ);
      setOnlineUsers(onlineSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserItem)));

      // المتصدرون
      const topQ = query(
        collection(db, "users"),
        orderBy("points", "desc"),
        limit(5)
      );
      const topSnap = await getDocs(topQ);
      setTopUsers(topSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserItem)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kurdistan Chat</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>مرحباً، {profile?.displayName || "عزيزي"} 👋</Text>
        <Text style={styles.welcomeSub}>تواصل مع الأعضاء من حولك</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/chat")}>
          <Ionicons name="chatbubbles" size={28} color="#7c3aed" />
          <Text style={styles.actionText}>الدردشة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/members")}>
          <Ionicons name="people" size={28} color="#7c3aed" />
          <Text style={styles.actionText}>الأعضاء</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/profile")}>
          <Ionicons name="person" size={28} color="#7c3aed" />
          <Text style={styles.actionText}>حسابي</Text>
        </TouchableOpacity>
      </View>

      {/* Online Users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          متواجدون الآن ({onlineUsers.length})
        </Text>
        <FlatList
          horizontal
          data={onlineUsers}
          keyExtractor={item => item.uid}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.onlineUser}
              onPress={() => router.push(`/profile/${item.uid}`)}
            >
              <View style={styles.avatarWrapper}>
                {item.photoURL ? (
                  <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>{item.displayName?.[0] || "?"}</Text>
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>
              <Text style={styles.onlineName} numberOfLines={1}>{item.displayName}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Top Users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 المتصدرون</Text>
        {topUsers.map((item, index) => (
          <TouchableOpacity
            key={item.uid}
            style={styles.topUserRow}
            onPress={() => router.push(`/profile/${item.uid}`)}
          >
            <Text style={styles.rank}>#{index + 1}</Text>
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={styles.topAvatar} />
            ) : (
              <View style={[styles.topAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{item.displayName?.[0] || "?"}</Text>
              </View>
            )}
            <Text style={styles.topName}>{item.displayName}</Text>
            <Text style={styles.points}>{item.points} نقطة</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, paddingTop: 50,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#7c3aed" },
  welcomeCard: {
    margin: 16, padding: 20, backgroundColor: "#1a1a2e",
    borderRadius: 16, borderWidth: 1, borderColor: "#2a2a3e",
  },
  welcomeText: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  welcomeSub: { fontSize: 14, color: "#aaa" },
  quickActions: {
    flexDirection: "row", justifyContent: "space-around",
    marginHorizontal: 16, marginBottom: 8,
  },
  actionBtn: {
    flex: 1, alignItems: "center", padding: 16,
    backgroundColor: "#1a1a2e", borderRadius: 12, margin: 4,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  actionText: { color: "#fff", marginTop: 6, fontSize: 13 },
  section: { margin: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 12 },
  onlineUser: { alignItems: "center", marginRight: 16, width: 64 },
  avatarWrapper: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#0f0f1a",
  },
  onlineName: { color: "#ccc", fontSize: 11, marginTop: 4, textAlign: "center" },
  topUserRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a1a2e", borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#2a2a3e",
  },
  rank: { color: "#7c3aed", fontWeight: "bold", fontSize: 16, width: 30 },
  topAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  topName: { flex: 1, color: "#fff", fontSize: 15 },
  points: { color: "#7c3aed", fontSize: 13, fontWeight: "bold" },
});
