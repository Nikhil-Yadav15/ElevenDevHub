// src/lib/db/helpers.js
import { eq, and, lt, desc } from "drizzle-orm";
import { users, projects, deployments, sessions, cache } from "./schema.js";

/**
 * Generate a UUID v4
 * @returns {string} UUID string
 */
export function generateId() {
  return crypto.randomUUID();
}

// ============================================
// USER HELPERS
// ============================================

/**
 * Find user by GitHub ID
 */
export async function findUserByGithubId(db, githubId) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.githubId, githubId))
    .limit(1);
  return result[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(db, id) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] || null;
}

/**
 * Create or update user
 */
export async function upsertUser(db, userData) {
  const existing = await findUserByGithubId(db, userData.githubId);
  
  if (existing) {
    await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return { ...existing, ...userData };
  }
  
  const newUser = {
    id: generateId(),
    ...userData,
  };
  await db.insert(users).values(newUser);
  return newUser;
}

// ============================================
// SESSION HELPERS
// ============================================

/**
 * Create a new session
 */
export async function createSession(db, userId, expiresInDays = 7) {
  const session = {
    id: generateId(),
    userId,
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
  };
  await db.insert(sessions).values(session);
  return session;
}

/**
 * Find valid session by ID
 */
export async function findValidSession(db, sessionId) {
  const result = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, sessionId),
        lt(new Date(), sessions.expiresAt)
      )
    )
    .limit(1);
  return result[0] || null;
}

/**
 * Delete session
 */
export async function deleteSession(db, sessionId) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(db) {
  const result = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()));
  return result;
}

// ============================================
// PROJECT HELPERS
// ============================================

/**
 * Get all projects for a user
 */
export async function getProjectsByUserId(db, userId) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

/**
 * Find project by ID
 */
export async function findProjectById(db, projectId) {
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return result[0] || null;
}

/**
 * Find project by repo
 */
export async function findProjectByRepo(db, repoOwner, repoName) {
  const result = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.repoOwner, repoOwner),
        eq(projects.repoName, repoName)
      )
    )
    .limit(1);
  return result[0] || null;
}

/**
 * Create a new project
 */
export async function createProject(db, projectData) {
  const project = {
    id: generateId(),
    ...projectData,
  };
  await db.insert(projects).values(project);
  return project;
}

/**
 * Delete project
 */
export async function deleteProject(db, projectId) {
  await db.delete(projects).where(eq(projects.id, projectId));
}

// ============================================
// DEPLOYMENT HELPERS
// ============================================

/**
 * Get deployments for a project
 */
export async function getDeploymentsByProjectId(db, projectId, limit = 10) {
  return db
    .select()
    .from(deployments)
    .where(eq(deployments.projectId, projectId))
    .orderBy(desc(deployments.createdAt))
    .limit(limit);
}

/**
 * Find deployment by GitHub run ID
 */
export async function findDeploymentByRunId(db, githubRunId) {
  const result = await db
    .select()
    .from(deployments)
    .where(eq(deployments.githubRunId, githubRunId))
    .limit(1);
  return result[0] || null;
}

/**
 * Create or update deployment
 */
export async function upsertDeployment(db, deploymentData) {
  const existing = await findDeploymentByRunId(db, deploymentData.githubRunId);
  
  if (existing) {
    await db
      .update(deployments)
      .set({
        ...deploymentData,
        updatedAt: new Date(),
      })
      .where(eq(deployments.id, existing.id));
    return { ...existing, ...deploymentData };
  }
  
  const newDeployment = {
    id: generateId(),
    ...deploymentData,
  };
  await db.insert(deployments).values(newDeployment);
  return newDeployment;
}

// ============================================
// CACHE HELPERS
// ============================================

/**
 * Get cached value
 * @returns {any|null} Parsed JSON value or null if expired/missing
 */
export async function getCache(db, key) {
  const result = await db
    .select()
    .from(cache)
    .where(eq(cache.key, key))
    .limit(1);
  
  if (!result[0]) return null;
  
  // Check if expired
  if (new Date(result[0].expiresAt) < new Date()) {
    // Delete expired entry
    await db.delete(cache).where(eq(cache.key, key));
    return null;
  }
  
  return JSON.parse(result[0].value);
}

/**
 * Set cache value
 * @param {number} ttlSeconds - Time to live in seconds
 */
export async function setCache(db, key, value, ttlSeconds) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  
  await db
    .insert(cache)
    .values({
      key,
      value: JSON.stringify(value),
      expiresAt,
    })
    .onConflictDoUpdate({
      target: cache.key,
      set: {
        value: JSON.stringify(value),
        expiresAt,
      },
    });
}

/**
 * Delete cache entry
 */
export async function deleteCache(db, key) {
  await db.delete(cache).where(eq(cache.key, key));
}

/**
 * Clean up all expired cache entries
 */
export async function cleanupExpiredCache(db) {
  return db.delete(cache).where(lt(cache.expiresAt, new Date()));
}
