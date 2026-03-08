import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from "react-native";
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, doc, getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

export default function PrivateChatScreen() {
  const { id: otherUid } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // إنشاء chatId فريد من uid المستخدمين
  const chatId = [user?.uid, otherUid].sort().join("_");

  useEffect(() => {
    if (!otherUid) return;
    getDoc(doc(db, "users", otherUid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setOtherUser(data);
        navigation.setOptions({ title: data.displayName || "محادثة" });
      }
    });
  }, [otherUid]);

  useEffect(() => {
    const q = query(
      collection(db, "privateChats", chatId, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)).reverse();
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [chatId]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    const msg = text.trim();
    setText("");
    try {
      await addDoc(collection(db, "privateChats", chatId, "messages"), {
        text: msg,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={styles.msgText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Other user info */}
      {otherUser && (
        <View style={styles.userBar}>
          {otherUser.photoURL ? (
            <Image source={{ uri: otherUser.photoURL }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{otherUser.displayName?.[0]}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{otherUser.displayName}</Text>
            <Text style={[styles.userStatus, { color: otherUser.isOnline ? "#22c55e" : "#666" }]}>
              {otherUser.isOnline ? "متصل الآن" : "غير متصل"}
            </Text>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالة..."
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          multiline
          textAlign="right"
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  userBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, backgroundColor: "#1a1a2e",
    borderBottomWidth: 1, borderBottomColor: "#2a2a3e",
  },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  userName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  userStatus: { fontSize: 12, marginTop: 2 },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: "row", marginBottom: 10 },
  msgRowMe: { flexDirection: "row-reverse" },
  bubble: { maxWidth: "75%", padding: 10, borderRadius: 16 },
  bubbleMe: { backgroundColor: "#7c3aed", borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#1a1a2e", borderBottomLeftRadius: 4 },
  msgText: { color: "#fff", fontSize: 15 },
  inputRow: {
    flexDirection: "row", padding: 12, borderTopWidth: 1,
    borderTopColor: "#1a1a2e", alignItems: "flex-end", gap: 8,
  },
  input: {
    flex: 1, backgroundColor: "#1a1a2e", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: "#fff",
    fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: "#2a2a3e",
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center",
  },
});
