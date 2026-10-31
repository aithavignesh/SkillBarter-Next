import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { env } from "../src/config/env";

describe("SkillBarter Two-User Complete Exchange Lifecycle", () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let exchangeId: string;
  let sessionId: string;
  let conversationId: string;
  let tsSkillId: string;
  let pySkillId: string;

  it("1. Registers User A and User B independently", async () => {
    // User A
    const resA = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "alice@example.com",
        password: "Password123!",
        displayName: "Alice Developer",
      });

    expect(resA.status).toBe(201);
    expect(resA.body.success).toBe(true);
    expect(resA.body.data.user.email).toBe("alice@example.com");
    userAId = resA.body.data.user.id;

    // Unverified users must not be able to establish a session.
    const unverifiedLoginA = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });
    expect(unverifiedLoginA.status).toBe(403);
    expect(unverifiedLoginA.body.error.code).toBe("EMAIL_NOT_VERIFIED");

    // A GET link visit must not consume the token (email scanners may prefetch it).
    const prefetchedLinkA = await request(app)
      .get(`/api/v1/auth/verify-email/link?token=${encodeURIComponent(resA.body.data.verificationToken)}`);
    expect(prefetchedLinkA.status).toBe(303);
    expect(prefetchedLinkA.headers.location).toContain("/verify-email?token=");
    const stillUnverifiedA = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });
    expect(stillUnverifiedA.status).toBe(403);

    // Verify email for User A, then authenticate.
    const verifyResA = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: resA.body.data.verificationToken });
    expect(verifyResA.status).toBe(200);
    expect(verifyResA.body.data.user.isEmailVerified).toBe(true);
    const loginA = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });
    expect(loginA.status).toBe(200);
    userAToken = loginA.body.data.accessToken;

    // User B
    const resB = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "bob@example.com",
        password: "Password123!",
        displayName: "Bob DataScientist",
      });

    expect(resB.status).toBe(201);
    userBId = resB.body.data.user.id;

    // Verify email for User B, then authenticate.
    const verifyResB = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: resB.body.data.verificationToken });
    expect(verifyResB.status).toBe(200);
    const loginB = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });
    expect(loginB.status).toBe(200);
    userBToken = loginB.body.data.accessToken;
  });

  it("2. Validates login and rejected invalid credentials", async () => {
    const invalidRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "WrongPassword" });
    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body.success).toBe(false);

    const validRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });
    expect(validRes.status).toBe(200);
    expect(validRes.body.data.accessToken).toBeDefined();
  });

  it("3. User A and User B complete onboarding with reciprocal skills", async () => {
    // Alice teaches TypeScript, wants Python
    const onboardA = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        displayName: "Alice Dev",
        bio: "Senior TypeScript Engineer passionate about clean code.",
        location: "New York, USA",
        preferredSessionFormat: "video",
        availability: "Weeknights and weekends",
        offeredSkills: [
          {
            skillName: "TypeScript",
            category: "Software Development",
            proficiency: "expert",
            description: "Full-stack TypeScript and React architecture.",
            yearsExperience: 6,
          },
        ],
        wantedSkills: [
          {
            skillName: "Python",
            category: "Software Development",
            proficiency: "beginner",
            description: "Looking to learn pandas and machine learning basics.",
            yearsExperience: 0,
          },
        ],
      });

    expect(onboardA.status).toBe(200);
    expect(onboardA.body.data.user.onboardingCompleted).toBe(true);

    // Bob teaches Python, wants TypeScript
    const onboardB = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${userBToken}`)
      .send({
        displayName: "Bob Data",
        bio: "Data scientist with Python, eager to build web interfaces.",
        location: "Toronto, Canada",
        preferredSessionFormat: "video",
        availability: "Flexible schedule",
        offeredSkills: [
          {
            skillName: "Python",
            category: "Software Development",
            proficiency: "expert",
            description: "Python scripting, data pipelines, and algorithms.",
            yearsExperience: 5,
          },
        ],
        wantedSkills: [
          {
            skillName: "TypeScript",
            category: "Software Development",
            proficiency: "beginner",
            description: "Wanting to build TypeScript frontend dashboards.",
            yearsExperience: 0,
          },
        ],
      });

    expect(onboardB.status).toBe(200);
    expect(onboardB.body.data.user.onboardingCompleted).toBe(true);
  });

  it("4. User A discovers User B with perfect reciprocal matching", async () => {
    const discoverRes = await request(app)
      .get("/api/v1/matches/discover")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(discoverRes.status).toBe(200);
    expect(discoverRes.body.success).toBe(true);
    expect(discoverRes.body.data.length).toBeGreaterThan(0);

    const matchWithBob = discoverRes.body.data.find(
      (m: { user: { id: string } }) => m.user.id === userBId
    );
    expect(matchWithBob).toBeDefined();
    expect(matchWithBob.reciprocalMatch).toBe(true);
    expect(matchWithBob.compatibilityScore).toBeGreaterThanOrEqual(90);
    expect(matchWithBob.theyTeachYouLearn[0].name).toBe("Python");
    expect(matchWithBob.youTeachTheyLearn[0].name).toBe("TypeScript");

    pySkillId = matchWithBob.theyTeachYouLearn[0].skillId;
    tsSkillId = matchWithBob.youTeachTheyLearn[0].skillId;
  });

  it("5. User A initiates an exchange request with User B", async () => {
    const createExRes = await request(app)
      .post("/api/v1/exchanges")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        recipientId: userBId,
        offeredSkillId: tsSkillId,
        wantedSkillId: pySkillId,
        proposalDescription:
          "Hi Bob! I would love to teach you TypeScript fundamentals and Next.js in exchange for Python data analysis tutoring.",
      });

    expect(createExRes.status).toBe(201);
    expect(createExRes.body.data.exchange.status).toBe("PENDING");
    exchangeId = createExRes.body.data.exchange.id;

    // Check notifications for User B
    const notifRes = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.data.some((n: { type: string }) => n.type === "EXCHANGE_REQUESTED")).toBe(true);
  });

  it("6. User B accepts the exchange request", async () => {
    const acceptRes = await request(app)
      .patch(`/api/v1/exchanges/${exchangeId}/status`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ status: "ACCEPTED" });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.exchange.status).toBe("ACCEPTED");
  });

  it("7. User A proposes a session and User B confirms it", async () => {
    const startTime = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    const endTime = new Date(Date.now() + 90000000).toISOString();

    const sessionRes = await request(app)
      .post(`/api/v1/exchanges/${exchangeId}/sessions`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        exchangeId,
        title: "Session 1: TypeScript Basics & Python Environment Setup",
        startTime,
        endTime,
        notes: "We'll do 45 mins TS, 45 mins Python.",
        meetingLink: "https://meet.example.com/skillbarter-1",
      });

    expect(sessionRes.status).toBe(201);
    expect(sessionRes.body.data.session.status).toBe("PROPOSED");
    sessionId = sessionRes.body.data.session.id;

    // User B confirms session
    const confirmRes = await request(app)
      .patch(`/api/v1/exchanges/${exchangeId}/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ status: "CONFIRMED" });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.session.status).toBe("CONFIRMED");

    // Exchange status should now be SCHEDULED
    const exCheck = await request(app)
      .get(`/api/v1/exchanges/${exchangeId}`)
      .set("Authorization", `Bearer ${userAToken}`);
    expect(exCheck.body.data.exchange.status).toBe("SCHEDULED");
  });

  it("8. User A and User B exchange messages in private conversation", async () => {
    const convRes = await request(app)
      .get("/api/v1/messages/conversations")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(convRes.status).toBe(200);
    expect(convRes.body.data.conversations.length).toBeGreaterThan(0);
    conversationId = convRes.body.data.conversations[0].id;

    // Alice sends message
    const msg1 = await request(app)
      .post(`/api/v1/messages/conversations/${conversationId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ content: "Looking forward to our session tomorrow!" });
    expect(msg1.status).toBe(201);
    expect(msg1.body.data.message.content).toBe("Looking forward to our session tomorrow!");

    // Bob replies
    const msg2 = await request(app)
      .post(`/api/v1/messages/conversations/${conversationId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ content: "Me too! I have prepared the notebooks." });
    expect(msg2.status).toBe(201);

    // List messages
    const listMsg = await request(app)
      .get(`/api/v1/messages/conversations/${conversationId}`)
      .set("Authorization", `Bearer ${userAToken}`);
    expect(listMsg.status).toBe(200);
    expect(listMsg.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("9. Both users confirm completion and exchange becomes COMPLETED", async () => {
    // Alice confirms
    const compA = await request(app)
      .post(`/api/v1/exchanges/${exchangeId}/complete`)
      .set("Authorization", `Bearer ${userAToken}`);
    expect(compA.status).toBe(200);
    expect(compA.body.data.exchange.completionStatus.requesterConfirmed).toBe(true);
    expect(compA.body.data.exchange.status).not.toBe("COMPLETED"); // Not yet, waiting for Bob

    // Bob confirms
    const compB = await request(app)
      .post(`/api/v1/exchanges/${exchangeId}/complete`)
      .set("Authorization", `Bearer ${userBToken}`);
    expect(compB.status).toBe(200);
    expect(compB.body.data.exchange.completionStatus.recipientConfirmed).toBe(true);
    expect(compB.body.data.exchange.status).toBe("COMPLETED");

    // Both users' completedExchangesCount should now be 1
    const checkUserA = await request(app).get(`/api/v1/users/${userAId}`);
    expect(checkUserA.body.data.profile.completedExchangesCount).toBe(1);
  });

  it("10. User A leaves a 5-star review for User B", async () => {
    const reviewRes = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        exchangeId,
        rating: 5,
        comment: "Bob was fantastic! Patient, knowledgeable, and gave great Python exercises.",
      });

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.data.review.rating).toBe(5);

    // Verify duplicate review is rejected
    const dupRes = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        exchangeId,
        rating: 4,
        comment: "Trying to submit second review.",
      });
    expect(dupRes.status).toBe(409);

    // Verify Bob's profile shows the review
    const bReviews = await request(app).get(`/api/v1/reviews/user/${userBId}`);
    expect(bReviews.status).toBe(200);
    expect(bReviews.body.data.reviews.length).toBe(1);
    expect(bReviews.body.data.reviews[0].rating).toBe(5);
  });

  it("11. Community connection and posts", async () => {
    // Alice requests connection with Bob
    const connRes = await request(app)
      .post("/api/v1/community/connections")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ recipientId: userBId });
    expect(connRes.status).toBe(201);

    // Bob accepts connection
    const acceptConn = await request(app)
      .patch(`/api/v1/community/connections/${connRes.body.data.connection.id}/accept`)
      .set("Authorization", `Bearer ${userBToken}`);
    expect(acceptConn.status).toBe(200);
    expect(acceptConn.body.data.connection.status).toBe("ACCEPTED");

    // Alice creates community post
    const postRes = await request(app)
      .post("/api/v1/community/posts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Tips for Learning TypeScript in 2026",
        content: "Start with strict mode from day one and master discriminated unions!",
        tags: ["typescript", "learning"],
      });
    expect(postRes.status).toBe(201);
  });

  it("12. Safety: User B reports and blocks, verifying access rejection", async () => {
    // User B reports an issue
    const reportRes = await request(app)
      .post("/api/v1/safety/report")
      .set("Authorization", `Bearer ${userBToken}`)
      .send({
        targetType: "user",
        targetId: userAId,
        reason: "Test report for moderation verification",
        description: "Checking that safety report creation works properly.",
      });
    expect(reportRes.status).toBe(201);

    // User B blocks User A
    const blockRes = await request(app)
      .post("/api/v1/safety/block")
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ userId: userAId, reason: "Safety test block" });
    expect(blockRes.status).toBe(200);

    // User A cannot message User B anymore
    const msgAttempt = await request(app)
      .post(`/api/v1/messages/conversations/${conversationId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ content: "Are you still there?" });
    expect(msgAttempt.status).toBe(403);

    // User B unblocks User A
    const unblockRes = await request(app)
      .delete(`/api/v1/safety/block/${userAId}`)
      .set("Authorization", `Bearer ${userBToken}`);
    expect(unblockRes.status).toBe(200);
  });

  it("13. Admin bootstrapping, stats, user moderation, and audit logs", async () => {
    // Bootstrap admin
    const bootRes = await request(app)
      .post("/api/v1/admin/bootstrap")
      .send({
        secretKey: env.JWT_ACCESS_SECRET,
        email: "admin@skillbarter.local",
        password: "AdminPassword123!",
        displayName: "System Admin",
      });
    expect(bootRes.status).toBe(200);

    // Login as admin
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@skillbarter.local", password: "AdminPassword123!" });
    const adminToken = loginRes.body.data.accessToken;

    // Platform stats
    const statsRes = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.stats.totalUsers).toBeGreaterThanOrEqual(3);
    expect(statsRes.body.data.stats.completedExchanges).toBe(1);

    // Ordinary user cannot access admin stats
    const forbiddenRes = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${userAToken}`);
    expect(forbiddenRes.status).toBe(403);

    // Audit logs
    const auditRes = await request(app)
      .get("/api/v1/admin/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);
  });
});
