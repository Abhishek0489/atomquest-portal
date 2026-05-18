import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.auditLog.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.goalDependency.deleteMany();
  await prisma.goalVersion.deleteMany();
  await prisma.sharedGoalRecipient.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const managerPassword = await bcrypt.hash("Manager@123", 10);
  const employeePassword = await bcrypt.hash("Employee@123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "admin@atomquest.com",
      password: adminPassword,
      role: "ADMIN",
      department: "Executive",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Rahul Mehta",
      email: "manager@atomquest.com",
      password: managerPassword,
      role: "MANAGER",
      department: "Sales",
      managerId: admin.id,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      name: "Arjun Verma",
      email: "employee@atomquest.com",
      password: employeePassword,
      role: "EMPLOYEE",
      department: "Sales",
      managerId: manager.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: "Sneha Patel",
      email: "employee2@atomquest.com",
      password: employeePassword,
      role: "EMPLOYEE",
      department: "Operations",
      managerId: manager.id,
    },
  });

  const cycle = await prisma.cycle.create({
    data: {
      year: 2026,
      phase: "GOAL_SETTING",
      openDate: new Date("2026-01-01"),
      closeDate: new Date("2026-12-31"),
      isActive: true,
    },
  });

  const goalApproved = await prisma.goal.create({
    data: {
      ownerId: employee1.id,
      cycleId: cycle.id,
      thrustArea: "Revenue Growth",
      title: "Increase Q1 Sales Revenue",
      description: "Achieve regional sales target for Q1",
      uomType: "NUMERIC_MIN",
      target: 1000000,
      weightage: 40,
      status: "APPROVED",
    },
  });

  const goalSubmitted = await prisma.goal.create({
    data: {
      ownerId: employee1.id,
      cycleId: cycle.id,
      thrustArea: "Operational Excellence",
      title: "Reduce Order Processing TAT",
      description: "Lower average turnaround time for order fulfillment",
      uomType: "NUMERIC_MAX",
      target: 48,
      weightage: 30,
      status: "SUBMITTED",
    },
  });

  const goalDraft = await prisma.goal.create({
    data: {
      ownerId: employee1.id,
      cycleId: cycle.id,
      thrustArea: "People & Culture",
      title: "Complete Leadership Training",
      description: "Finish mandatory leadership development program",
      uomType: "TIMELINE",
      target: 1,
      targetDate: new Date("2026-09-30"),
      weightage: 30,
      status: "DRAFT",
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: employee2.id,
      cycleId: cycle.id,
      thrustArea: "Revenue Growth",
      title: "Launch New Product Line",
      description: "Successfully launch product line in target market",
      uomType: "NUMERIC_MIN",
      target: 500000,
      weightage: 50,
      status: "SUBMITTED",
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: employee2.id,
      cycleId: cycle.id,
      thrustArea: "Operational Excellence",
      title: "Zero Safety Incidents",
      description: "Maintain zero recordable safety incidents",
      uomType: "ZERO",
      target: 0,
      weightage: 50,
      status: "SUBMITTED",
    },
  });

  const snapshotV1 = {
    title: goalApproved.title,
    description: goalApproved.description,
    thrustArea: goalApproved.thrustArea,
    uomType: goalApproved.uomType,
    target: 800000,
    weightage: 35,
    targetDate: null,
    status: "SUBMITTED",
  };

  const snapshotV2 = {
    title: goalApproved.title,
    description: goalApproved.description,
    thrustArea: goalApproved.thrustArea,
    uomType: goalApproved.uomType,
    target: 900000,
    weightage: 38,
    targetDate: null,
    status: "SUBMITTED",
  };

  await prisma.goalVersion.create({
    data: {
      goalId: goalApproved.id,
      changedById: employee1.id,
      snapshot: snapshotV1,
      changeNote: "Initial submission with original target",
    },
  });

  await prisma.goalVersion.create({
    data: {
      goalId: goalApproved.id,
      changedById: manager.id,
      snapshot: snapshotV2,
      changeNote: "Manager edited target during approval review",
    },
  });

  await prisma.goalDependency.create({
    data: {
      dependentGoalId: goalSubmitted.id,
      requiredGoalId: goalApproved.id,
    },
  });

  await prisma.checkin.create({
    data: {
      goalId: goalApproved.id,
      period: "Q1",
      actualValue: 750000,
      progressStatus: "ON_TRACK",
      computedScore: 75,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: employee1.id,
        goalId: goalApproved.id,
        action: "GOAL_CREATED",
        details: { title: goalApproved.title },
      },
      {
        userId: employee1.id,
        goalId: goalApproved.id,
        action: "GOAL_SUBMITTED",
        details: { status: "SUBMITTED" },
      },
      {
        userId: manager.id,
        goalId: goalApproved.id,
        action: "TARGET_EDITED",
        details: { before: 900000, after: 1000000 },
      },
      {
        userId: manager.id,
        goalId: goalApproved.id,
        action: "GOAL_APPROVED",
        details: { status: "APPROVED" },
      },
      {
        userId: employee1.id,
        goalId: goalApproved.id,
        action: "CHECKIN_SUBMITTED",
        details: { period: "Q1", actualValue: 750000 },
      },
    ],
  });

  console.log("Seed completed:");
  console.log("  Users: 4");
  console.log("  Cycle: 1 (active, GOAL_SETTING)");
  console.log("  Goals: 5");
  console.log("  GoalVersions: 2");
  console.log("  GoalDependencies: 1");
  console.log("  Checkins: 1");
  console.log("  AuditLogs: 5");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
