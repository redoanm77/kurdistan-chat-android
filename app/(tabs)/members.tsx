import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, RefreshControl,
} from "react-native";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface UserItem {
  uid: string;
  displayName: string;
  photoURL: string;
  isOnline: boolean;
  points: number;
  bio: string;
}

export default function MembersScreen() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [filtered, setFiltered] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showOnline, setShowOnline] = useState(false);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("points", "desc"), limit(100));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserItem));
      setUsers(list);
      setFiltered(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = users;
    if (showOnline) result = result.filter(u => u.isOnline);
    if (search) result = result.filter(u =>
      u.displayName?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, showOnline, users]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const renderUser = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      style={styles.userCard}
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
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName}</Text>
        <Text style={styles.userBio} numberOfLines={1}>{item.bio || "لا يوجد وصف"}</Text>
      </View>
      <View style={styles.pointsContainer}>
        <Text style={styles.points}>{item.points || 0}</Text>
        <Text style={styles.pointsLabel}>نقطة</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الأعضاء</Text>
        <Text style={styles.count}>{filtered.length} عضو</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن عضو..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, showOnline && styles.filterBtnActive]}
          onPress={() => setShowOnline(!showOnline)}
        >
          <View style={[styles.dot, { backgroundColor: showOnline ? "#22c55e" : "#666" }]} />
          <Text style={[styles.filterText, showOnline && { color: "#22c55e" }]}>متصل</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.uid}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        ListEmptyComponent={
          <Text style={styles.empty}>لا يوجد أعضاء</Text>
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
  searchRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a1a2e", borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 10 },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#1a1a2e", borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 10, borderWidth: 1, borderColor: "#2a2a3e",
  },
  filterBtnActive: { borderColor: "#22c55e" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  filterText: { color: "#666", fontSize: 13 },
  list: { padding: 16, paddingTop: 4 },
  userCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a1a2e", borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#2a2a3e",
  },
  avatarWrapper: { position: "relative", marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#0f0f1a",
  },
  userInfo: { flex: 1 },
  userName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  userBio: { color: "#888", fontSize: 13, marginTop: 2 },
  pointsContainer: { alignItems: "center" },
  points: { color: "#7c3aed", fontSize: 16, fontWeight: "bold" },
  pointsLabel: { color: "#666", fontSize: 11 },
  empty: { textAlign: "center", color: "#666", marginTop: 40, fontSize: 16 },
});
