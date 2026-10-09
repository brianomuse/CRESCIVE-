# CRESCIVE Chat & Collaboration Security Specification & Invariants (Quarter 4)

## 1. Data Invariants

1. **Authoritative Identity (Zero Mocking)**:
   - Every user record in `/users/{userId}` must have its document ID equal to the Firebase Auth UID (`request.auth.uid == userId`).
   - A user cannot create or modify a profile belonging to another user.
   - PII and unauthenticated access are blocked; unauthenticated users cannot read or write private chat data.

2. **Growth Circles Access Control (Quarter 4)**:
   - A user can only access `/circles/{circleId}` if their UID is present in `resource.data.memberIds` or `resource.data.invitedFriendIds`.
   - Only the creator can delete the circle or archive/unarchive it.
   - Leaving a circle immediately removes the user's UID from `memberIds`, thereby cutting off all access to circle data, shared items, and sanctuary sessions immediately at the Firestore Security Rules layer.

3. **Shared Accountability Invariants (Quarter 4)**:
   - Only circle members can read `/circles/{circleId}/sharedItems/{itemId}`.
   - Only items intentionally created by their owner can be added: `request.resource.data.ownerId == request.auth.uid`.
   - Modifying item details (title, domain, targetDate) is restricted to the item's owner: `request.resource.data.ownerId == resource.data.ownerId`.
   - Private personal goals, habits, reflections, and unshared items are NEVER transmitted or accessible.

4. **Deep Work Sanctuary Invariants (Quarter 4)**:
   - Synchronized focus sessions in `/circles/{circleId}/sanctuarySessions/{sessionId}` are restricted to circle members.
   - Only circle members can start a session (`request.resource.data.hostId == request.auth.uid`).
   - Circle members can join or leave the synchronized active session by updating `activeParticipantIds`.

5. **Direct Messaging & Real-Time Presence Invariants (Quarters 1-3)**:
   - Direct conversations require that the accessing user is a member of `participantIds`.
   - Real-time typing indicators are keyed by authenticated UID and stored directly on the conversation document.
   - Read status timestamps are maintained by each participant for their own account.
   - Any verified participant in the conversation can add or remove their own emoji reaction or update read receipts.

---

## 2. The Dirty Dozen Attack Payloads (All Blocked by Security Rules)

1. **Payload 1: Non-Member Circle Snooping**
   - User `user_eve` attempts to read `/circles/circle_alpha` where she is not in `memberIds` or `invitedFriendIds`.
   - Result: `PERMISSION_DENIED`.

2. **Payload 2: Non-Member Shared Accountability Inspection**
   - User `user_eve` attempts to read `/circles/circle_alpha/sharedItems/item_1`.
   - Result: `PERMISSION_DENIED` (`request.auth.uid in get(...).data.memberIds` fails).

3. **Payload 3: Impersonating Shared Item Owner**
   - Authenticated as `user_eve`, attempting to create a shared item with `ownerId: "user_alice"`.
   - Result: `PERMISSION_DENIED` (`request.resource.data.ownerId == request.auth.uid` fails).

4. **Payload 4: Deleting Another User's Shared Item**
   - Regular member `user_bob` attempts to delete `user_alice`'s shared move without being the owner or creator.
   - Result: `PERMISSION_DENIED`.

5. **Payload 5: Crashing Sanctuary Focus Session as Non-Member**
   - Non-member `user_eve` attempts to write to `/circles/circle_alpha/sanctuarySessions/session_1`.
   - Result: `PERMISSION_DENIED`.

6. **Payload 6: Unauthorized Circle Destruction**
   - Member `user_bob` attempts to delete a circle created by `user_alice`.
   - Result: `PERMISSION_DENIED` (`resource.data.creatorId == request.auth.uid` fails).

7. **Payload 7: Post-Leave Circle Snooping**
   - User `user_charlie` left the circle (UID removed from `memberIds`), then attempts to read new shared items.
   - Result: `PERMISSION_DENIED` (Membership check fails immediately).

8. **Payload 8: Unauthenticated Circle Creation**
   - Unauthenticated client attempting to create `/circles/circle_hack`.
   - Result: `PERMISSION_DENIED` (`isSignedIn()` evaluates to false).

9. **Payload 9: Direct Conversation Snooping**
   - User `user_eve` attempts to read `/conversations/direct_alice_bob`.
   - Result: `PERMISSION_DENIED`.

10. **Payload 10: Identity Spoofing on Message Creation**
    - Authenticated as `user_eve`, sending message with `senderId: "user_alice"`.
    - Result: `PERMISSION_DENIED`.

11. **Payload 11: Self-Friending Loophole**
    - Attempting to create a friend request where `fromUid == toUid`.
    - Result: `PERMISSION_DENIED`.

12. **Payload 12: Malformed or Oversized Document ID Injection**
    - Attempting to write to `/circles/<1.5KB junk characters>`.
    - Result: `PERMISSION_DENIED` (`isValidId` size check fails).
