import { Injectable, inject } from '@angular/core';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  limit as firestoreLimit
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';

export interface AppSettings {
  profileUploadsEnabled: boolean;
  profileUploadsUpdatedAt?: any;
  profileUploadsUpdatedBy?: string;
  update_es?: string;
  update_en?: string;
  minVersion?: string;
  recommendedVersion?: string;
}

export interface CleanupResult {
  deleted: number;
  repaired: number;
  profilesRepaired: number;
  fieldsRemoved: number;
}

export interface PrepareResult {
  repairedUsers: number;
  usernamesPrepared: number;
  postsSynced: number;
}

export interface ResetResult {
  usersReset: number;
  deletedPosts: number;
}

export interface SystemOverviewStats {
  totalUsers: number;
  totalCommunityPosts: number;
  totalAchievementPosts: number;
  totalUsernames: number;
}

@Injectable({
  providedIn: 'root'
})
export class SystemAdminService {
  private fb = inject(FirebaseService);
  private auth = inject(AuthService);

  private ensureSuperAdmin(): void {
    const user = this.auth.currentUser();
    if (!user || !user.isSuperAdmin) {
      throw new Error('Operación restringida exclusivamente para Superadministradores.');
    }
  }

  /**
   * Obtiene la configuración global de la aplicación desde /config/app_settings
   */
  async getAppSettings(): Promise<AppSettings> {
    try {
      const docRef = doc(this.fb.firestore, 'config', 'app_settings');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          profileUploadsEnabled: data['profileUploadsEnabled'] ?? true,
          profileUploadsUpdatedAt: data['profileUploadsUpdatedAt'],
          profileUploadsUpdatedBy: data['profileUploadsUpdatedBy'],
          update_es: data['update_es'],
          update_en: data['update_en'],
          minVersion: data['minVersion'],
          recommendedVersion: data['recommendedVersion']
        };
      }
    } catch (err) {
      console.warn('Error leyendo /config/app_settings:', err);
    }
    return { profileUploadsEnabled: true };
  }

  /**
   * Activa o desactiva la subida de fotos de perfil en la app móvil
   */
  async setProfileUploadsEnabled(enabled: boolean): Promise<void> {
    this.ensureSuperAdmin();
    const user = this.auth.currentUser();
    const docRef = doc(this.fb.firestore, 'config', 'app_settings');
    await setDoc(docRef, {
      profileUploadsEnabled: enabled,
      profileUploadsUpdatedAt: Date.now(),
      profileUploadsUpdatedBy: user?.uid || 'superadmin'
    }, { merge: true });
  }

  /**
   * Obtiene estadísticas globales de documentos para la vista de superadmin
   */
  async getSystemOverviewStats(): Promise<SystemOverviewStats> {
    try {
      const [usersSnap, routinesSnap, achSnap, usernamesSnap] = await Promise.all([
        getDocs(collection(this.fb.firestore, 'users')),
        getDocs(collection(this.fb.firestore, 'routines')),
        getDocs(collection(this.fb.firestore, 'achievements_posts')),
        getDocs(collection(this.fb.firestore, 'usernames'))
      ]);

      return {
        totalUsers: usersSnap.size,
        totalCommunityPosts: routinesSnap.size,
        totalAchievementPosts: achSnap.size,
        totalUsernames: usernamesSnap.size
      };
    } catch (err) {
      console.warn('Error obteniendo estadísticas del sistema:', err);
      return { totalUsers: 0, totalCommunityPosts: 0, totalAchievementPosts: 0, totalUsernames: 0 };
    }
  }

  /**
   * Limpia datos huérfanos (sociales, comentarios, likes, followers, usernames de usuarios eliminados)
   */
  async cleanupOrphanedSocialData(): Promise<CleanupResult> {
    this.ensureSuperAdmin();

    const usersSnapshot = await getDocs(collection(this.fb.firestore, 'users'));
    const existingUserIds = new Set(usersSnapshot.docs.map(d => d.id));
    const existingUsers = new Map(usersSnapshot.docs.map(d => [d.id, d.data()]));

    let deleted = 0;
    let repaired = 0;
    let profilesRepaired = 0;
    let fieldsRemoved = 0;

    // 1. Limpieza de colección de publicaciones (routines y achievements_posts)
    const cleanPostCollection = async (collectionName: 'routines' | 'achievements_posts') => {
      const postsSnapshot = await getDocs(collection(this.fb.firestore, collectionName));
      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        const ownerId = collectionName === 'routines' ? postData['creatorId'] : postData['userId'];

        if (ownerId && !existingUserIds.has(ownerId)) {
          // Publicación de usuario eliminado: borrarla junto con likes y comentarios
          const [likesSnap, commentsSnap] = await Promise.all([
            getDocs(collection(this.fb.firestore, collectionName, postDoc.id, 'likes')),
            getDocs(collection(this.fb.firestore, collectionName, postDoc.id, 'comments'))
          ]);

          const b = writeBatch(this.fb.firestore);
          likesSnap.docs.forEach(d => { b.delete(d.ref); deleted++; });
          commentsSnap.docs.forEach(d => { b.delete(d.ref); deleted++; });
          b.delete(postDoc.ref);
          deleted++;
          await b.commit();
          continue;
        }

        // Si la publicación es de un usuario existente, purgar likes y comentarios de usuarios inexistentes
        const [likesSnap, commentsSnap] = await Promise.all([
          getDocs(collection(this.fb.firestore, collectionName, postDoc.id, 'likes')),
          getDocs(collection(this.fb.firestore, collectionName, postDoc.id, 'comments'))
        ]);

        const validComments: any[] = [];
        let batch = writeBatch(this.fb.firestore);
        let batchCount = 0;

        likesSnap.docs.forEach(d => {
          const likeUserId = d.id || d.data()['userId'];
          if (!likeUserId || !existingUserIds.has(likeUserId)) {
            batch.delete(d.ref);
            deleted++;
            batchCount++;
          }
        });

        commentsSnap.docs.forEach(d => {
          const cUserId = d.data()['userId'];
          if (!cUserId || !existingUserIds.has(cUserId) || !d.data()['text']) {
            batch.delete(d.ref);
            deleted++;
            batchCount++;
          } else {
            validComments.push(d.data());
          }
        });

        const validLikesCount = likesSnap.docs.filter(d => existingUserIds.has(d.id || d.data()['userId'])).length;
        const updateData: any = {
          likesCount: validLikesCount,
          commentsCount: validComments.length
        };
        if (validComments.length > 0) {
          updateData.latestComment = {
            userName: validComments[0]['userName'] || 'Atleta',
            text: validComments[0]['text'] || ''
          };
        }

        batch.set(postDoc.ref, updateData, { merge: true });
        repaired++;
        batchCount++;

        if (batchCount > 0) {
          await batch.commit();
        }
      }
    };

    await cleanPostCollection('routines');
    await cleanPostCollection('achievements_posts');

    // 2. Limpieza de followers/following huérfanos y reparación de perfiles sin nombre
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const [followersSnap, followingSnap] = await Promise.all([
        getDocs(collection(this.fb.firestore, 'users', userDoc.id, 'followers')),
        getDocs(collection(this.fb.firestore, 'users', userDoc.id, 'following'))
      ]);

      let batch = writeBatch(this.fb.firestore);
      let batchCount = 0;

      followersSnap.docs.forEach(d => {
        if (!existingUserIds.has(d.id)) {
          batch.delete(d.ref);
          deleted++;
          batchCount++;
        }
      });

      followingSnap.docs.forEach(d => {
        if (!existingUserIds.has(d.id)) {
          batch.delete(d.ref);
          deleted++;
          batchCount++;
        }
      });

      const userPatch: any = {};
      if (!userData['displayName'] || String(userData['displayName']).trim().length < 2) {
        userPatch.displayName = (userData['email'] || '').split('@')[0] || 'Atleta BeStrong';
        profilesRepaired++;
      }
      userPatch.followersCount = followersSnap.docs.filter(d => existingUserIds.has(d.id)).length;
      userPatch.followingCount = followingSnap.docs.filter(d => existingUserIds.has(d.id)).length;

      batch.set(userDoc.ref, userPatch, { merge: true });
      batchCount++;
      repaired++;

      if (batchCount > 0) {
        await batch.commit();
      }
    }

    // 3. Limpieza de /usernames huérfanos
    const usernamesSnapshot = await getDocs(collection(this.fb.firestore, 'usernames'));
    let usernameBatch = writeBatch(this.fb.firestore);
    let uCount = 0;
    usernamesSnapshot.docs.forEach(docSnap => {
      const uid = docSnap.data()['uid'];
      if (!uid || !existingUserIds.has(uid)) {
        usernameBatch.delete(docSnap.ref);
        deleted++;
        uCount++;
      }
    });
    if (uCount > 0) {
      await usernameBatch.commit();
    }

    // 4. Limpieza de alumnos anónimos o sin cuenta registrada en assigned_routines
    const assignedRoutinesSnapshot = await getDocs(collection(this.fb.firestore, 'assigned_routines'));
    for (const rDoc of assignedRoutinesSnapshot.docs) {
      const rData = rDoc.data();
      const rawTrainees: any[] = Array.isArray(rData['trainees']) ? rData['trainees'] : [];
      const validTrainees = rawTrainees.filter(t =>
        t && t.uid && t.uid !== 'anonimo' && t.email && t.email !== 'No disponible'
      );

      if (validTrainees.length !== rawTrainees.length || rData['timesRedeemed'] !== validTrainees.length) {
        await setDoc(rDoc.ref, {
          trainees: validTrainees,
          timesRedeemed: validTrainees.length,
          lastCleanedAtMs: Date.now()
        }, { merge: true });
        repaired++;
        deleted += (rawTrainees.length - validTrainees.length);
      }
    }

    return { deleted, repaired, profilesRepaired, fieldsRemoved };
  }

  /**
   * Prepara y repara la estructura de Firestore (app_settings, ranking, usernames, identidades)
   */
  async prepareFirestoreStructure(): Promise<PrepareResult> {
    this.ensureSuperAdmin();
    const user = this.auth.currentUser();

    // 1. Asegurar /config/app_settings
    const settingsDocRef = doc(this.fb.firestore, 'config', 'app_settings');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, {
        profileUploadsEnabled: true,
        profileUploadsUpdatedAt: Date.now(),
        profileUploadsUpdatedBy: user?.uid || 'superadmin',
        update_es: 'Nueva versión disponible de BeStrong con mejoras y estabilidad.',
        update_en: 'New version of BeStrong available with improvements and stability.'
      }, { merge: true });
    }

    // 2. Normalizar usuarios y usernames
    const usersSnapshot = await getDocs(collection(this.fb.firestore, 'users'));
    let batch = writeBatch(this.fb.firestore);
    let batchCount = 0;
    let repairedUsers = 0;
    let usernamesPrepared = 0;

    for (const uDoc of usersSnapshot.docs) {
      const data = uDoc.data();
      const patch: any = {
        uid: data['uid'] || uDoc.id,
        displayName: data['displayName'] || (data['email'] || '').split('@')[0] || 'Atleta BeStrong',
        followersCount: Math.max(0, Number(data['followersCount'] || 0)),
        followingCount: Math.max(0, Number(data['followingCount'] || 0)),
        rankingUpdatedAt: Date.now()
      };

      if (data['xp'] !== undefined && !data['level']) {
        const xp = Number(data['xp']) || 0;
        patch.level = Math.max(1, Math.floor(xp / 100) + 1);
      }

      if (data['username']) {
        const normalized = String(data['username']).toLowerCase().trim();
        patch.username = normalized;
        patch.usernameNormalized = normalized;

        const uNameRef = doc(this.fb.firestore, 'usernames', normalized);
        batch.set(uNameRef, {
          uid: uDoc.id,
          username: normalized,
          updatedAt: Date.now()
        }, { merge: true });
        usernamesPrepared++;
        batchCount++;
      }

      batch.set(uDoc.ref, patch, { merge: true });
      repairedUsers++;
      batchCount++;

      if (batchCount >= 400) {
        await batch.commit();
        batch = writeBatch(this.fb.firestore);
        batchCount = 0;
      }
    }
    if (batchCount > 0) {
      await batch.commit();
    }

    // 3. Sincronizar identidad en publicaciones de la comunidad
    let postsSynced = 0;
    const refreshedUsers = await getDocs(collection(this.fb.firestore, 'users'));
    const userMap = new Map(refreshedUsers.docs.map(d => [d.id, d.data()]));

    const syncPosts = async (colName: 'routines' | 'achievements_posts') => {
      const postsSnap = await getDocs(collection(this.fb.firestore, colName));
      let pBatch = writeBatch(this.fb.firestore);
      let pCount = 0;

      for (const pDoc of postsSnap.docs) {
        const pData = pDoc.data();
        const ownerId = colName === 'routines' ? pData['creatorId'] : pData['userId'];
        const owner = ownerId ? userMap.get(ownerId) : null;
        if (!owner) continue;

        const patch: any = colName === 'routines'
          ? {
              creatorName: owner['displayName'] || 'Coach',
              creatorUsername: owner['username'] || null,
              creatorPhotoURL: owner['photoURL'] || null
            }
          : {
              userName: owner['displayName'] || 'Atleta',
              userUsername: owner['username'] || null,
              userPhotoURL: owner['photoURL'] || null
            };

        pBatch.set(pDoc.ref, patch, { merge: true });
        pCount++;
        postsSynced++;

        if (pCount >= 400) {
          await pBatch.commit();
          pBatch = writeBatch(this.fb.firestore);
          pCount = 0;
        }
      }
      if (pCount > 0) {
        await pBatch.commit();
      }
    };

    await syncPosts('routines');
    await syncPosts('achievements_posts');

    return { repairedUsers, usernamesPrepared, postsSynced };
  }

  /**
   * Resetea ligas, XP y publicaciones de logros (Zona de Peligro)
   */
  async resetGamificationData(): Promise<ResetResult> {
    this.ensureSuperAdmin();

    const usersSnapshot = await getDocs(collection(this.fb.firestore, 'users'));
    let batch = writeBatch(this.fb.firestore);
    let batchCount = 0;
    let usersReset = 0;

    for (const uDoc of usersSnapshot.docs) {
      batch.update(uDoc.ref, {
        gamification: null,
        xp: 0,
        peakXP: 0,
        level: 1,
        leagueId: 'bronze',
        animalRankId: 'rank_1',
        rankingUpdatedAt: Date.now()
      });
      usersReset++;
      batchCount++;

      if (batchCount >= 400) {
        await batch.commit();
        batch = writeBatch(this.fb.firestore);
        batchCount = 0;
      }
    }
    if (batchCount > 0) {
      await batch.commit();
    }

    // Eliminar publicaciones de logros
    const achSnap = await getDocs(collection(this.fb.firestore, 'achievements_posts'));
    let deletedPosts = 0;
    for (const postDoc of achSnap.docs) {
      const [likes, comments] = await Promise.all([
        getDocs(collection(this.fb.firestore, 'achievements_posts', postDoc.id, 'likes')),
        getDocs(collection(this.fb.firestore, 'achievements_posts', postDoc.id, 'comments'))
      ]);

      const b = writeBatch(this.fb.firestore);
      likes.docs.forEach(d => b.delete(d.ref));
      comments.docs.forEach(d => b.delete(d.ref));
      b.delete(postDoc.ref);
      deletedPosts++;
      await b.commit();
    }

    return { usersReset, deletedPosts };
  }
}
