import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  getDocFromServer,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { UserProfile } from "../types";

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with explicit database ID if provided, otherwise default
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// ==================== ERROR HANDLING ====================
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==================== CONNECTION TEST ====================
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.warn("Firestore offline mode active or network disconnected.");
      return false;
    }
    return true;
  }
}

// ==================== REAL USER TYPES & SYNC ====================
export interface RealChatUser {
  uid: string;
  displayName: string;
  preferredName: string;
  username?: string;
  email: string;
  photoURL: string;
  becoming: string;
  online: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
  id: string; // fromUid_toUid
  fromUid: string;
  toUid: string;
  fromName: string;
  toName: string;
  fromAvatar: string;
  toAvatar: string;
  fromBecoming?: string;
  toBecoming?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id: string; // [uidA, uidB].sort().join('_')
  users: string[];
  user1: string;
  user2: string;
  createdAt: string;
}

export interface GrowthMilestoneShare {
  type: "move" | "streak" | "becoming" | "focus";
  title: string;
  subtitle?: string;
  icon?: string;
  category?: string;
}

export interface DirectConversation {
  id: string;
  type: "direct";
  participantIds: string[];
  participantDetails?: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
      becoming?: string;
    };
  };
  lastMessageText?: string;
  lastSenderId?: string;
  lastSenderName?: string;
  lastMessageAt?: string;
  typing?: {
    [uid: string]: {
      isTyping: boolean;
      lastTypedAt: string;
    };
  };
  readStatus?: {
    [uid: string]: {
      lastReadAt: string;
      lastReadMessageId: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  participantIds?: string[];
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  read?: boolean;
  readAt?: string;
  reactions?: { [emoji: string]: string[] }; // emoji character -> array of user UIDs
  milestone?: GrowthMilestoneShare;
  createdAt: string;
}

// ==================== QUARTER 4: GROWTH CIRCLES & SANCTUARY TYPES ====================
export interface CircleMemberDetail {
  displayName: string;
  photoURL?: string;
  becoming?: string;
  role: "creator" | "member";
  joinedAt: string;
}

export interface GrowthCircle {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  memberIds: string[];
  invitedFriendIds?: string[];
  memberDetails: {
    [uid: string]: CircleMemberDetail;
  };
  focusArea: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface CircleSharedItem {
  id: string;
  circleId: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  type: "move" | "goal";
  title: string;
  domain: string;
  timeCommitment?: string;
  status: "in_progress" | "completed";
  progressPercent?: number;
  cheers?: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SanctuarySession {
  id: string;
  circleId: string;
  hostId: string;
  hostName: string;
  intention: string;
  durationMinutes: number;
  startedAt: string;
  endsAt: string;
  status: "active" | "completed" | "cancelled";
  activeParticipantIds: string[];
  participantNames?: { [uid: string]: string };
  createdAt: string;
}

/**
 * Synchronizes the current authenticated user's CRESCIVE profile into Firestore.
 */
export async function syncRealUserToFirestore(
  user: FirebaseUser,
  profile: UserProfile | null
): Promise<void> {
  if (!user || !user.uid) return;

  const userRef = doc(db, "users", user.uid);
  const now = new Date().toISOString();

  const chosenName =
    profile?.preferredName?.trim() ||
    user.displayName?.trim() ||
    user.email?.split("@")[0] ||
    "CRESCIVE Member";

  const chosenAvatar = profile?.avatarUrl || user.photoURL || "";

  const rawUsername = user.email
    ? user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "")
    : chosenName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const username = rawUsername || "member";

  const payload: RealChatUser = {
    uid: user.uid,
    displayName: chosenName,
    preferredName: chosenName,
    username: username,
    email: user.email || "",
    photoURL: chosenAvatar,
    becoming: profile?.becoming || "Continuous self-growth & progress",
    online: true,
    lastSeen: now,
    createdAt: profile?.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    console.error("Failed to sync user to Firestore:", error);
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

/**
 * Updates the user's online presence status
 */
export async function updateUserPresence(
  uid: string,
  online: boolean
): Promise<void> {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  try {
    await setDoc(
      userRef,
      {
        online,
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to update presence:", error);
  }
}

/**
 * Listens to real registered CRESCIVE members in Firestore (bounded to 100 for efficiency).
 * Sanitizes user records so private email addresses are never leaked in public discovery.
 */
export function listenToRealUsers(
  callback: (users: RealChatUser[]) => void,
  onError?: (err: Error) => void
): () => void {
  const usersCol = collection(db, "users");
  const q = query(usersCol, limit(100));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const users: RealChatUser[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as RealChatUser;
        const derivedUsername =
          raw.username ||
          (raw.email ? raw.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") : "") ||
          (raw.displayName ? raw.displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") : "") ||
          "member";
        users.push({
          ...raw,
          username: derivedUsername,
          // Privacy boundary: never expose private email address in public member directory
          email: "",
        });
      });
      callback(users);
    },
    (error) => {
      console.error("Failed to listen to users collection:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, "users");
    }
  );

  return unsubscribe;
}

// ==================== FRIENDSHIPS & REQUESTS ====================

export function getFriendshipId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export function getDirectConversationId(uid1: string, uid2: string): string {
  return `direct_${getFriendshipId(uid1, uid2)}`;
}

/**
 * Sends a friend request to a real CRESCIVE member.
 */
export async function sendFriendRequest(
  targetUser: RealChatUser,
  currentUserProfile: UserProfile | null
): Promise<{ success: boolean; message: string }> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error("You must be authenticated to send friend requests.");
  }

  if (currentAuthUser.uid === targetUser.uid) {
    return { success: false, message: "You cannot add yourself as a friend." };
  }

  const friendshipId = getFriendshipId(currentAuthUser.uid, targetUser.uid);
  const outgoingReqId = `${currentAuthUser.uid}_${targetUser.uid}`;
  const incomingReqId = `${targetUser.uid}_${currentAuthUser.uid}`;

  // 1. Check if already friends
  try {
    const friendshipSnap = await getDoc(doc(db, "friendships", friendshipId));
    if (friendshipSnap.exists()) {
      return { success: false, message: "You are already friends!" };
    }
  } catch (err) {
    console.warn("Friendship pre-check bypassed:", err);
  }

  // 2. Check if the target user has already sent an incoming request
  try {
    const incomingSnap = await getDoc(doc(db, "friendRequests", incomingReqId));
    if (incomingSnap.exists()) {
      const incomingData = incomingSnap.data() as FriendRequest;
      if (incomingData.status === "pending") {
        await acceptFriendRequest(incomingData, currentUserProfile);
        return {
          success: true,
          message: `${targetUser.displayName} had already sent you a request! You are now friends.`,
        };
      }
    }
  } catch (err) {
    console.warn("Incoming request pre-check bypassed:", err);
  }

  // 3. Check if outgoing request is already pending
  try {
    const outgoingSnap = await getDoc(doc(db, "friendRequests", outgoingReqId));
    if (outgoingSnap.exists()) {
      const outgoingData = outgoingSnap.data() as FriendRequest;
      if (outgoingData.status === "pending") {
        return { success: false, message: "Friend request is already pending." };
      }
    }
  } catch (err) {
    console.warn("Outgoing request pre-check bypassed:", err);
  }

  const now = new Date().toISOString();
  const myName =
    currentUserProfile?.preferredName?.trim() ||
    currentAuthUser.displayName ||
    currentAuthUser.email?.split("@")[0] ||
    "CRESCIVE Member";
  const myAvatar =
    currentUserProfile?.avatarUrl || currentAuthUser.photoURL || "";

  const requestPayload: FriendRequest = {
    id: outgoingReqId,
    fromUid: currentAuthUser.uid,
    toUid: targetUser.uid,
    fromName: myName,
    toName: targetUser.displayName || targetUser.preferredName || "Member",
    fromAvatar: myAvatar,
    toAvatar: targetUser.photoURL || "",
    fromBecoming: currentUserProfile?.becoming || "",
    toBecoming: targetUser.becoming || "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, "friendRequests", outgoingReqId), requestPayload);
    return { success: true, message: `Friend request sent to ${targetUser.displayName}!` };
  } catch (error) {
    console.error("Failed to write friend request to Firestore:", error);
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `friendRequests/${outgoingReqId}`
    );
  }
}

/**
 * Accepts an incoming friend request and provisions the 1-to-1 conversation room.
 */
export async function acceptFriendRequest(
  request: FriendRequest,
  currentUserProfile: UserProfile | null
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const now = new Date().toISOString();
  const friendshipId = getFriendshipId(request.fromUid, request.toUid);
  const convoId = getDirectConversationId(request.fromUid, request.toUid);

  try {
    // 1. Update the request
    await setDoc(
      doc(db, "friendRequests", request.id),
      {
        status: "accepted",
        updatedAt: now,
      },
      { merge: true }
    );

    // 2. Create the confirmed friendship document
    const [u1, u2] = [request.fromUid, request.toUid].sort();
    const friendshipPayload: Friendship = {
      id: friendshipId,
      users: [request.fromUid, request.toUid],
      user1: u1,
      user2: u2,
      createdAt: now,
    };
    await setDoc(doc(db, "friendships", friendshipId), friendshipPayload);

    // 3. Initialize the 1-to-1 Direct Conversation room
    const myName =
      currentUserProfile?.preferredName ||
      currentAuthUser.displayName ||
      "CRESCIVE Member";
    const myAvatar =
      currentUserProfile?.avatarUrl || currentAuthUser.photoURL || "";

    const convoPayload: DirectConversation = {
      id: convoId,
      type: "direct",
      participantIds: [request.fromUid, request.toUid],
      participantDetails: {
        [request.fromUid]: {
          displayName: request.fromName,
          photoURL: request.fromAvatar,
          becoming: request.fromBecoming,
        },
        [request.toUid]: {
          displayName: myName,
          photoURL: myAvatar,
          becoming: currentUserProfile?.becoming,
        },
      },
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "conversations", convoId), convoPayload, { merge: true });
  } catch (error) {
    console.error("Failed to accept friend request:", error);
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `friendships/${friendshipId}`
    );
  }
}

/**
 * Declines or cancels a friend request.
 */
export async function declineOrCancelFriendRequest(requestId: string): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  try {
    await deleteDoc(doc(db, "friendRequests", requestId));
  } catch (error) {
    console.error("Failed to decline/cancel friend request:", error);
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `friendRequests/${requestId}`
    );
  }
}

/**
 * Removes a friendship between current user and target user.
 */
export async function unfriendUser(targetUid: string): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const friendshipId = getFriendshipId(currentAuthUser.uid, targetUid);
  try {
    await deleteDoc(doc(db, "friendships", friendshipId));

    const req1 = `${currentAuthUser.uid}_${targetUid}`;
    const req2 = `${targetUid}_${currentAuthUser.uid}`;
    await deleteDoc(doc(db, "friendRequests", req1)).catch(() => {});
    await deleteDoc(doc(db, "friendRequests", req2)).catch(() => {});
  } catch (error) {
    console.error("Failed to unfriend user:", error);
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `friendships/${friendshipId}`
    );
  }
}

/**
 * Listens to incoming and outgoing friend requests for the current user.
 */
export function listenToFriendRequests(
  uid: string,
  callback: (incoming: FriendRequest[], outgoing: FriendRequest[]) => void,
  onError?: (err: Error) => void
): () => void {
  const requestsCol = collection(db, "friendRequests");

  // Single-field queries avoid requiring composite index in Firestore
  const qIncoming = query(requestsCol, where("toUid", "==", uid));
  const qOutgoing = query(requestsCol, where("fromUid", "==", uid));

  let currentIncoming: FriendRequest[] = [];
  let currentOutgoing: FriendRequest[] = [];

  const unsubIncoming = onSnapshot(
    qIncoming,
    (snap) => {
      currentIncoming = snap.docs
        .map((d) => d.data() as FriendRequest)
        .filter((r) => r.status === "pending");
      currentIncoming.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(currentIncoming, currentOutgoing);
    },
    (err) => {
      console.error("Error in listenToFriendRequests (incoming):", err);
      if (onError) onError(err);
    }
  );

  const unsubOutgoing = onSnapshot(
    qOutgoing,
    (snap) => {
      currentOutgoing = snap.docs
        .map((d) => d.data() as FriendRequest)
        .filter((r) => r.status === "pending");
      currentOutgoing.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(currentIncoming, currentOutgoing);
    },
    (err) => {
      console.error("Error in listenToFriendRequests (outgoing):", err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubIncoming();
    unsubOutgoing();
  };
}

/**
 * Listens to active confirmed friendships for the current user.
 */
export function listenToFriendships(
  uid: string,
  callback: (friendUids: string[]) => void,
  onError?: (err: Error) => void
): () => void {
  const friendshipsCol = collection(db, "friendships");
  const q = query(friendshipsCol, where("users", "array-contains", uid));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const friendUids: string[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Friendship;
        const otherUid = data.users.find((u) => u !== uid);
        if (otherUid) friendUids.push(otherUid);
      });
      callback(friendUids);
    },
    (err) => {
      console.error("Error listening to friendships:", err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

// ==================== DIRECT MESSAGING & REAL-TIME POLISH ====================

export async function getOrCreateDirectConversation(
  targetUser: RealChatUser,
  currentUserProfile: UserProfile | null
): Promise<string> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const convoId = getDirectConversationId(currentAuthUser.uid, targetUser.uid);
  const convoRef = doc(db, "conversations", convoId);
  const now = new Date().toISOString();

  const myName =
    currentUserProfile?.preferredName ||
    currentAuthUser.displayName ||
    "CRESCIVE Member";
  const myAvatar =
    currentUserProfile?.avatarUrl || currentAuthUser.photoURL || "";

  try {
    const convoSnap = await getDoc(convoRef);
    if (!convoSnap.exists()) {
      const payload: DirectConversation = {
        id: convoId,
        type: "direct",
        participantIds: [currentAuthUser.uid, targetUser.uid],
        participantDetails: {
          [currentAuthUser.uid]: {
            displayName: myName,
            photoURL: myAvatar,
            becoming: currentUserProfile?.becoming,
          },
          [targetUser.uid]: {
            displayName: targetUser.displayName,
            photoURL: targetUser.photoURL,
            becoming: targetUser.becoming,
          },
        },
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(convoRef, payload);
    }
    return convoId;
  } catch (error) {
    console.error("Failed to get/create direct conversation:", error);
    handleFirestoreError(error, OperationType.WRITE, `conversations/${convoId}`);
  }
}

export function listenToConversations(
  uid: string,
  callback: (convos: DirectConversation[]) => void,
  onError?: (err: Error) => void
): () => void {
  const convosCol = collection(db, "conversations");
  const q = query(convosCol, where("participantIds", "array-contains", uid));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const convos: DirectConversation[] = [];
      snap.forEach((docSnap) => {
        convos.push(docSnap.data() as DirectConversation);
      });
      convos.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
      callback(convos);
    },
    (err) => {
      console.error("Error listening to conversations:", err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, "conversations");
    }
  );

  return unsubscribe;
}

export function listenToConversation(
  conversationId: string,
  callback: (convo: DirectConversation | null) => void,
  onError?: (err: Error) => void
): () => void {
  const convoRef = doc(db, "conversations", conversationId);

  const unsubscribe = onSnapshot(
    convoRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as DirectConversation);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error("Error listening to conversation doc:", err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

export async function setTypingStatus(
  conversationId: string,
  isTyping: boolean
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser || !conversationId) return;

  const convoRef = doc(db, "conversations", conversationId);
  try {
    await setDoc(
      convoRef,
      {
        typing: {
          [currentAuthUser.uid]: {
            isTyping,
            lastTypedAt: new Date().toISOString(),
          },
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Typing status update skipped:", err);
  }
}

export async function markConversationAsRead(
  conversationId: string,
  lastMessageId?: string,
  unreadMessageIds?: string[]
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser || !conversationId) return;

  const now = new Date().toISOString();
  const convoRef = doc(db, "conversations", conversationId);

  try {
    await setDoc(
      convoRef,
      {
        readStatus: {
          [currentAuthUser.uid]: {
            lastReadAt: now,
            lastReadMessageId: lastMessageId || "",
          },
        },
      },
      { merge: true }
    );

    if (unreadMessageIds && unreadMessageIds.length > 0) {
      await Promise.all(
        unreadMessageIds.map((msgId) =>
          setDoc(
            doc(db, "conversations", conversationId, "messages", msgId),
            {
              read: true,
              readAt: now,
            },
            { merge: true }
          ).catch((err) => {
            console.warn("Could not mark message read:", msgId, err);
          })
        )
      );
    }
  } catch (err) {
    console.warn("Failed to mark conversation as read:", err);
  }
}

export async function toggleMessageReaction(
  conversationId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser || !conversationId || !messageId) return;

  const msgRef = doc(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId
  );

  try {
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data() as ChatMessageItem;
    const currentReactions: { [key: string]: string[] } = {
      ...(data.reactions || {}),
    };
    const userList: string[] = currentReactions[emoji]
      ? [...currentReactions[emoji]]
      : [];

    const userIndex = userList.indexOf(currentAuthUser.uid);
    if (userIndex >= 0) {
      userList.splice(userIndex, 1);
    } else {
      userList.push(currentAuthUser.uid);
    }

    if (userList.length === 0) {
      delete currentReactions[emoji];
    } else {
      currentReactions[emoji] = userList;
    }

    await setDoc(
      msgRef,
      {
        reactions: currentReactions,
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to toggle reaction:", err);
    handleFirestoreError(
      err,
      OperationType.UPDATE,
      `conversations/${conversationId}/messages/${messageId}`
    );
  }
}

export async function sendMessage(
  conversationId: string,
  text: string,
  currentUserProfile: UserProfile | null,
  milestone?: GrowthMilestoneShare
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const trimmedText = text.trim();
  if (!trimmedText && !milestone) return;
  if (trimmedText.length > 2000) {
    throw new Error("Message exceeds the 2000 character limit.");
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const messageRef = doc(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId
  );
  const convoRef = doc(db, "conversations", conversationId);
  const now = new Date().toISOString();

  const myName =
    currentUserProfile?.preferredName ||
    currentAuthUser.displayName ||
    currentAuthUser.email?.split("@")[0] ||
    "CRESCIVE Member";
  const myAvatar =
    currentUserProfile?.avatarUrl || currentAuthUser.photoURL || "";

  const uids = conversationId.replace(/^direct_/, "").split("_");

  const messagePayload: ChatMessageItem = {
    id: messageId,
    conversationId,
    participantIds: uids.length === 2 ? uids : [currentAuthUser.uid],
    senderId: currentAuthUser.uid,
    senderName: myName,
    senderAvatar: myAvatar,
    text: trimmedText || `Shared a Growth Milestone: ${milestone?.title}`,
    read: false,
    reactions: {},
    createdAt: now,
  };

  if (milestone) {
    messagePayload.milestone = milestone;
  }

  try {
    await setDoc(messageRef, messagePayload);

    await setDoc(
      convoRef,
      {
        lastMessageText: messagePayload.text,
        lastSenderId: currentAuthUser.uid,
        lastSenderName: myName,
        lastMessageAt: now,
        updatedAt: now,
        typing: {
          [currentAuthUser.uid]: {
            isTyping: false,
            lastTypedAt: now,
          },
        },
      },
      { merge: true }
    );

    // Dispatch real push notification to recipient device via secure server endpoint
    if (uids.length === 2) {
      const recipientUid = uids.find((id) => id !== currentAuthUser.uid);
      if (recipientUid) {
        fetch("/api/notifications/send-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderUid: currentAuthUser.uid,
            senderName: myName,
            senderAvatar: myAvatar,
            recipientUid,
            conversationId,
          }),
        }).catch((pushErr) => {
          console.warn("Could not dispatch chat push notification:", pushErr);
        });
      }
    }
  } catch (error) {
    console.error("Failed to send message:", error);
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `conversations/${conversationId}/messages/${messageId}`
    );
  }
}

export async function sendGrowthMilestone(
  conversationId: string,
  milestone: GrowthMilestoneShare,
  currentUserProfile: UserProfile | null
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  let summaryText = "";
  switch (milestone.type) {
    case "move":
      summaryText = `🌱 Completed Daily Move: "${milestone.title}"`;
      break;
    case "streak":
      summaryText = `🔥 Consistency Milestone: ${milestone.title}`;
      break;
    case "becoming":
      summaryText = `✨ Becoming Affirmation: "${milestone.title}"`;
      break;
    case "focus":
      summaryText = `🎯 Focus Area: ${milestone.title}`;
      break;
    default:
      summaryText = `🌟 Growth Milestone: ${milestone.title}`;
  }

  await sendMessage(conversationId, summaryText, currentUserProfile, milestone);
}

export function listenToMessages(
  conversationId: string,
  callback: (messages: ChatMessageItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const messagesCol = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const unsubscribe = onSnapshot(
    messagesCol,
    (snap) => {
      const msgs: ChatMessageItem[] = [];
      snap.forEach((docSnap) => {
        msgs.push(docSnap.data() as ChatMessageItem);
      });
      msgs.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      callback(msgs);
    },
    (err) => {
      console.error("Error listening to messages:", err);
      if (onError) onError(err);
      handleFirestoreError(
        err,
        OperationType.LIST,
        `conversations/${conversationId}/messages`
      );
    }
  );

  return unsubscribe;
}

// ==================== QUARTER 4: GROWTH CIRCLES & SANCTUARY ====================

/**
 * Creates a new private Growth Circle.
 */
export async function createGrowthCircle(
  name: string,
  description: string,
  focusArea: string,
  invitedFriends: RealChatUser[],
  currentUserProfile: UserProfile | null
): Promise<string> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Circle name is required.");

  const circleId = `circle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const circleRef = doc(db, "circles", circleId);
  const now = new Date().toISOString();

  const myName =
    currentUserProfile?.preferredName ||
    currentAuthUser.displayName ||
    "CRESCIVE Member";
  const myAvatar =
    currentUserProfile?.avatarUrl || currentAuthUser.photoURL || "";

  const invitedFriendUids = invitedFriends.map((f) => f.uid);

  const payload: GrowthCircle = {
    id: circleId,
    name: trimmedName,
    description: description.trim() || "Peer accountability and collaborative growth.",
    creatorId: currentAuthUser.uid,
    creatorName: myName,
    memberIds: [currentAuthUser.uid],
    invitedFriendIds: invitedFriendUids,
    memberDetails: {
      [currentAuthUser.uid]: {
        displayName: myName,
        photoURL: myAvatar,
        becoming: currentUserProfile?.becoming || "",
        role: "creator",
        joinedAt: now,
      },
    },
    focusArea: focusArea || "All Disciplines",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(circleRef, payload);
    return circleId;
  } catch (error) {
    console.error("Failed to create growth circle:", error);
    handleFirestoreError(error, OperationType.CREATE, `circles/${circleId}`);
  }
}

/**
 * Listens to all Growth Circles where user is a member or has an invitation.
 */
export function listenToUserCircles(
  uid: string,
  callback: (circles: GrowthCircle[]) => void,
  onError?: (err: Error) => void
): () => void {
  const circlesCol = collection(db, "circles");
  const qMember = query(circlesCol, where("memberIds", "array-contains", uid));
  const qInvited = query(
    circlesCol,
    where("invitedFriendIds", "array-contains", uid)
  );

  let memberCircles: GrowthCircle[] = [];
  let invitedCircles: GrowthCircle[] = [];

  const mergeAndEmit = () => {
    const map = new Map<string, GrowthCircle>();
    memberCircles.forEach((c) => map.set(c.id, c));
    invitedCircles.forEach((c) => map.set(c.id, c));

    const combined = Array.from(map.values());
    combined.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
    callback(combined);
  };

  const unsubMember = onSnapshot(
    qMember,
    (snap) => {
      memberCircles = snap.docs.map((d) => d.data() as GrowthCircle);
      mergeAndEmit();
    },
    (err) => {
      console.error("Error listening to member circles:", err);
      if (onError) onError(err);
    }
  );

  const unsubInvited = onSnapshot(
    qInvited,
    (snap) => {
      invitedCircles = snap.docs.map((d) => d.data() as GrowthCircle);
      mergeAndEmit();
    },
    (err) => {
      console.error("Error listening to invited circles:", err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubMember();
    unsubInvited();
  };
}

/**
 * Listens to a single Growth Circle document.
 */
export function listenToCircle(
  circleId: string,
  callback: (circle: GrowthCircle | null) => void,
  onError?: (err: Error) => void
): () => void {
  const circleRef = doc(db, "circles", circleId);

  const unsubscribe = onSnapshot(
    circleRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as GrowthCircle);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error("Error listening to circle:", err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Invites a confirmed friend to an active Growth Circle.
 */
export async function inviteFriendToCircle(
  circleId: string,
  friend: RealChatUser
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const circleRef = doc(db, "circles", circleId);

  try {
    const snap = await getDoc(circleRef);
    if (!snap.exists()) throw new Error("Circle not found.");

    const circle = snap.data() as GrowthCircle;
    const currentInvited = circle.invitedFriendIds || [];

    if (circle.memberIds.includes(friend.uid)) {
      throw new Error(`${friend.displayName} is already a member.`);
    }

    if (currentInvited.includes(friend.uid)) {
      return; // Already invited
    }

    await setDoc(
      circleRef,
      {
        invitedFriendIds: [...currentInvited, friend.uid],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to invite friend to circle:", error);
    handleFirestoreError(error, OperationType.UPDATE, `circles/${circleId}`);
  }
}

/**
 * Joins an invited Growth Circle.
 */
export async function joinCircle(
  circle: GrowthCircle,
  currentUserProfile: UserProfile | null
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const circleRef = doc(db, "circles", circle.id);
  const now = new Date().toISOString();

  const myName =
    currentUserProfile?.preferredName ||
    currentAuthUser.displayName ||
    "CRESCIVE Member";
  const myAvatar =
    currentUserProfile?.avatarUrl || currentAuthUser.photoURL || "";

  const updatedMembers = Array.from(
    new Set([...circle.memberIds, currentAuthUser.uid])
  );
  const updatedInvited = (circle.invitedFriendIds || []).filter(
    (id) => id !== currentAuthUser.uid
  );

  const updatedDetails = {
    ...(circle.memberDetails || {}),
    [currentAuthUser.uid]: {
      displayName: myName,
      photoURL: myAvatar,
      becoming: currentUserProfile?.becoming || "",
      role: (circle.creatorId === currentAuthUser.uid ? "creator" : "member") as "creator" | "member",
      joinedAt: now,
    },
  };

  try {
    await setDoc(
      circleRef,
      {
        memberIds: updatedMembers,
        invitedFriendIds: updatedInvited,
        memberDetails: updatedDetails,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to join circle:", error);
    handleFirestoreError(error, OperationType.UPDATE, `circles/${circle.id}`);
  }
}

/**
 * Leaves a Growth Circle.
 */
export async function leaveCircle(circleId: string): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const circleRef = doc(db, "circles", circleId);

  try {
    const snap = await getDoc(circleRef);
    if (!snap.exists()) return;

    const circle = snap.data() as GrowthCircle;
    const updatedMembers = circle.memberIds.filter(
      (id) => id !== currentAuthUser.uid
    );
    const updatedDetails = { ...circle.memberDetails };
    delete updatedDetails[currentAuthUser.uid];

    await setDoc(
      circleRef,
      {
        memberIds: updatedMembers,
        memberDetails: updatedDetails,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to leave circle:", error);
    handleFirestoreError(error, OperationType.UPDATE, `circles/${circleId}`);
  }
}

/**
 * Removes a member from a Growth Circle (creator control).
 */
export async function removeMemberFromCircle(
  circleId: string,
  memberUid: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const circleRef = doc(db, "circles", circleId);

  try {
    const snap = await getDoc(circleRef);
    if (!snap.exists()) return;

    const circle = snap.data() as GrowthCircle;
    if (circle.creatorId !== currentAuthUser.uid) {
      throw new Error("Only the circle creator can remove members.");
    }

    const updatedMembers = circle.memberIds.filter((id) => id !== memberUid);
    const updatedDetails = { ...circle.memberDetails };
    delete updatedDetails[memberUid];

    await setDoc(
      circleRef,
      {
        memberIds: updatedMembers,
        memberDetails: updatedDetails,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to remove member from circle:", error);
    handleFirestoreError(error, OperationType.UPDATE, `circles/${circleId}`);
  }
}

/**
 * Declines an invitation to join a Growth Circle.
 */
export async function declineCircleInvitation(circleId: string): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const circleRef = doc(db, "circles", circleId);

  try {
    const snap = await getDoc(circleRef);
    if (!snap.exists()) return;

    const circle = snap.data() as GrowthCircle;
    const updatedInvited = (circle.invitedFriendIds || []).filter(
      (id) => id !== currentAuthUser.uid
    );

    await setDoc(
      circleRef,
      {
        invitedFriendIds: updatedInvited,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to decline circle invitation:", error);
    handleFirestoreError(error, OperationType.UPDATE, `circles/${circleId}`);
  }
}

/**
 * Archives or unarchives a Growth Circle.
 */
export async function archiveCircle(
  circleId: string,
  archived: boolean
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const circleRef = doc(db, "circles", circleId);

  try {
    await setDoc(
      circleRef,
      {
        status: archived ? "archived" : "active",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to archive circle:", error);
    handleFirestoreError(error, OperationType.UPDATE, `circles/${circleId}`);
  }
}

/**
 * Permanently deletes a circle (creator only).
 */
export async function deleteCircle(circleId: string): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const circleRef = doc(db, "circles", circleId);

  try {
    await deleteDoc(circleRef);
  } catch (error) {
    console.error("Failed to delete circle:", error);
    handleFirestoreError(error, OperationType.DELETE, `circles/${circleId}`);
  }
}

/**
 * Shares an explicit Move or Goal with a Growth Circle for accountability.
 */
export async function shareItemWithCircle(
  circleId: string,
  item: {
    type: "move" | "goal";
    title: string;
    domain: string;
    timeCommitment?: string;
  },
  currentUserProfile: UserProfile | null
): Promise<string> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const itemRef = doc(db, "circles", circleId, "sharedItems", itemId);
  const now = new Date().toISOString();

  const myName =
    currentUserProfile?.preferredName ||
    currentAuthUser.displayName ||
    "CRESCIVE Member";
  const myAvatar =
    currentUserProfile?.avatarUrl || currentAuthUser.photoURL || "";

  const payload: CircleSharedItem = {
    id: itemId,
    circleId,
    ownerId: currentAuthUser.uid,
    ownerName: myName,
    ownerAvatar: myAvatar,
    type: item.type,
    title: item.title.trim(),
    domain: item.domain || "General Growth",
    timeCommitment: item.timeCommitment || "Daily Action",
    status: "in_progress",
    progressPercent: 0,
    cheers: [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(itemRef, payload);
    return itemId;
  } catch (error) {
    console.error("Failed to share item with circle:", error);
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `circles/${circleId}/sharedItems/${itemId}`
    );
  }
}

/**
 * Updates progress or completion status on a shared Move/Goal.
 */
export async function updateSharedItemStatus(
  circleId: string,
  itemId: string,
  status: "in_progress" | "completed",
  progressPercent?: number
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const itemRef = doc(db, "circles", circleId, "sharedItems", itemId);
  const now = new Date().toISOString();

  const updates: any = {
    status,
    progressPercent: status === "completed" ? 100 : (progressPercent ?? 50),
    updatedAt: now,
  };

  if (status === "completed") {
    updates.completedAt = now;
  }

  try {
    await setDoc(itemRef, updates, { merge: true });
  } catch (error) {
    console.error("Failed to update shared item status:", error);
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `circles/${circleId}/sharedItems/${itemId}`
    );
  }
}

/**
 * Toggles a cheer/celebration from the current user on a shared item.
 */
export async function toggleCheerSharedItem(
  circleId: string,
  itemId: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const itemRef = doc(db, "circles", circleId, "sharedItems", itemId);

  try {
    const snap = await getDoc(itemRef);
    if (!snap.exists()) return;

    const data = snap.data() as CircleSharedItem;
    const cheers = [...(data.cheers || [])];
    const idx = cheers.indexOf(currentAuthUser.uid);

    if (idx >= 0) {
      cheers.splice(idx, 1);
    } else {
      cheers.push(currentAuthUser.uid);
    }

    await setDoc(itemRef, { cheers, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Failed to cheer item:", error);
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `circles/${circleId}/sharedItems/${itemId}`
    );
  }
}

/**
 * Deletes a shared item (owner or circle creator).
 */
export async function deleteSharedItem(
  circleId: string,
  itemId: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const itemRef = doc(db, "circles", circleId, "sharedItems", itemId);

  try {
    await deleteDoc(itemRef);
  } catch (error) {
    console.error("Failed to delete shared item:", error);
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `circles/${circleId}/sharedItems/${itemId}`
    );
  }
}

/**
 * Listens to shared items in a Growth Circle.
 */
export function listenToCircleSharedItems(
  circleId: string,
  callback: (items: CircleSharedItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const itemsCol = collection(db, "circles", circleId, "sharedItems");

  const unsubscribe = onSnapshot(
    itemsCol,
    (snap) => {
      const items: CircleSharedItem[] = [];
      snap.forEach((d) => items.push(d.data() as CircleSharedItem));
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(items);
    },
    (err) => {
      console.error("Error listening to circle shared items:", err);
      if (onError) onError(err);
      handleFirestoreError(
        err,
        OperationType.LIST,
        `circles/${circleId}/sharedItems`
      );
    }
  );

  return unsubscribe;
}

// ==================== DEEP WORK SANCTUARY (SYNCHRONIZED FOCUS) ====================

/**
 * Starts a synchronized Deep Work Sanctuary session in a Growth Circle.
 */
export async function startSanctuarySession(
  circleId: string,
  intention: string,
  durationMinutes: number,
  currentUserProfile: UserProfile | null
): Promise<string> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sessionRef = doc(
    db,
    "circles",
    circleId,
    "sanctuarySessions",
    sessionId
  );

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const myName =
    currentUserProfile?.preferredName ||
    currentAuthUser.displayName ||
    "CRESCIVE Member";

  const payload: SanctuarySession = {
    id: sessionId,
    circleId,
    hostId: currentAuthUser.uid,
    hostName: myName,
    intention: intention.trim() || "Deep Work Flow Sprint",
    durationMinutes,
    startedAt: startDate.toISOString(),
    endsAt: endDate.toISOString(),
    status: "active",
    activeParticipantIds: [currentAuthUser.uid],
    participantNames: {
      [currentAuthUser.uid]: myName,
    },
    createdAt: startDate.toISOString(),
  };

  try {
    await setDoc(sessionRef, payload);
    return sessionId;
  } catch (error) {
    console.error("Failed to start sanctuary session:", error);
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `circles/${circleId}/sanctuarySessions/${sessionId}`
    );
  }
}

/**
 * Joins an active synchronized Deep Work Sanctuary session.
 */
export async function joinSanctuarySession(
  circleId: string,
  sessionId: string,
  currentUserProfile: UserProfile | null
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const sessionRef = doc(
    db,
    "circles",
    circleId,
    "sanctuarySessions",
    sessionId
  );

  const myName =
    currentUserProfile?.preferredName ||
    currentAuthUser.displayName ||
    "CRESCIVE Member";

  try {
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return;

    const session = snap.data() as SanctuarySession;
    const participants = Array.from(
      new Set([...session.activeParticipantIds, currentAuthUser.uid])
    );
    const participantNames = {
      ...(session.participantNames || {}),
      [currentAuthUser.uid]: myName,
    };

    await setDoc(
      sessionRef,
      {
        activeParticipantIds: participants,
        participantNames,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to join sanctuary session:", error);
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `circles/${circleId}/sanctuarySessions/${sessionId}`
    );
  }
}

/**
 * Leaves a synchronized Deep Work Sanctuary session.
 */
export async function leaveSanctuarySession(
  circleId: string,
  sessionId: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const sessionRef = doc(
    db,
    "circles",
    circleId,
    "sanctuarySessions",
    sessionId
  );

  try {
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return;

    const session = snap.data() as SanctuarySession;
    const participants = session.activeParticipantIds.filter(
      (id) => id !== currentAuthUser.uid
    );

    await setDoc(
      sessionRef,
      {
        activeParticipantIds: participants,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to leave sanctuary session:", error);
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `circles/${circleId}/sanctuarySessions/${sessionId}`
    );
  }
}

/**
 * Marks a synchronized Deep Work Sanctuary session as completed.
 */
export async function completeSanctuarySession(
  circleId: string,
  sessionId: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) throw new Error("Must be signed in.");

  const sessionRef = doc(
    db,
    "circles",
    circleId,
    "sanctuarySessions",
    sessionId
  );

  try {
    await setDoc(
      sessionRef,
      {
        status: "completed",
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to complete sanctuary session:", error);
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `circles/${circleId}/sanctuarySessions/${sessionId}`
    );
  }
}

/**
 * Listens to synchronized Deep Work Sanctuary sessions in a circle.
 */
export function listenToSanctuarySessions(
  circleId: string,
  callback: (sessions: SanctuarySession[]) => void,
  onError?: (err: Error) => void
): () => void {
  const sessionsCol = collection(
    db,
    "circles",
    circleId,
    "sanctuarySessions"
  );

  const unsubscribe = onSnapshot(
    sessionsCol,
    (snap) => {
      const list: SanctuarySession[] = [];
      snap.forEach((d) => list.push(d.data() as SanctuarySession));
      list.sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      callback(list);
    },
    (err) => {
      console.error("Error listening to sanctuary sessions:", err);
      if (onError) onError(err);
      handleFirestoreError(
        err,
        OperationType.LIST,
        `circles/${circleId}/sanctuarySessions`
      );
    }
  );

  return unsubscribe;
}

/**
 * Exports authorized circle collaboration data in a clean, sanitized JSON format.
 */
export function exportCircleData(
  circle: GrowthCircle,
  sharedItems: CircleSharedItem[],
  sanctuarySessions: SanctuarySession[]
): void {
  // Strip out any internal system tokens or non-authorized data
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    circle: {
      name: circle.name,
      description: circle.description,
      focusArea: circle.focusArea,
      creatorName: circle.creatorName,
      status: circle.status,
      createdAt: circle.createdAt,
      members: Object.entries(circle.memberDetails || {}).map(([uid, m]) => ({
        displayName: m.displayName,
        role: m.role,
        becoming: m.becoming,
        joinedAt: m.joinedAt,
      })),
    },
    sharedAccountabilityItems: sharedItems.map((item) => ({
      title: item.title,
      type: item.type,
      domain: item.domain,
      timeCommitment: item.timeCommitment,
      status: item.status,
      ownerName: item.ownerName,
      progressPercent: item.progressPercent,
      completedAt: item.completedAt,
      cheersCount: item.cheers?.length || 0,
    })),
    sanctuaryFocusSessions: sanctuarySessions.map((s) => ({
      intention: s.intention,
      durationMinutes: s.durationMinutes,
      hostName: s.hostName,
      status: s.status,
      startedAt: s.startedAt,
      endsAt: s.endsAt,
      participantCount: s.activeParticipantIds?.length || 0,
    })),
  };

  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `crescive_circle_${circle.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_export.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// ==================== AUTH METHODS ====================

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  if (auth.currentUser) {
    try {
      await updateUserPresence(auth.currentUser.uid, false);
    } catch {
      // Ignore if offline
    }
  }
  await signOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };
