const { PrismaClient } = require("@prisma/client");
const { scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  return scryptSync(
    password,
    "edunova-password-salt",
    64
  ).toString("hex");
}

async function main() {
  console.log("🌱 Starting EduNova seed...");

  // --------------------------------------------------
  // SCHOOL
  // --------------------------------------------------

  let school = await prisma.school.findUnique({
    where: {
      slug: "demo-school",
    },
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "EduNova Demo School",
        slug: "demo-school",
      },
    });

    console.log("✅ Demo school created");
  } else {
    console.log("✅ Demo school already exists");
  }

  // --------------------------------------------------
  // CLASS
  // --------------------------------------------------

  let schoolClass = await prisma.schoolClass.findUnique({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "JHS 1",
      },
    },
  });

  if (!schoolClass) {
    schoolClass = await prisma.schoolClass.create({
      data: {
        name: "JHS 1",
        schoolId: school.id,
      },
    });

    console.log("✅ JHS 1 created");
  }

  // --------------------------------------------------
  // SUBJECT
  // --------------------------------------------------

  let subject = await prisma.subject.findUnique({
    where: {
      schoolId_code: {
        schoolId: school.id,
        code: "MAT101",
      },
    },
  });

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        name: "Mathematics",
        code: "MAT101",
        schoolId: school.id,
      },
    });

    console.log("✅ Mathematics created");
  }

  // --------------------------------------------------
  // TEACHER
  // --------------------------------------------------

  let teacher = await prisma.teacher.findUnique({
    where: {
      employeeNumber: "EMP001",
    },
  });

  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: {
        employeeNumber: "EMP001",
        firstName: "John",
        lastName: "Teacher",
        gender: "Male",
        phone: "0200000000",
        email: "teacher@edunova.com",
        schoolId: school.id,
      },
    });

    console.log("✅ Teacher created");
  } else {
    teacher = await prisma.teacher.update({
      where: {
        id: teacher.id,
      },
      data: {
        email: "teacher@edunova.com",
        schoolId: school.id,
      },
    });

    console.log("✅ Teacher already exists");
  }

  // --------------------------------------------------
  // CLASS → SUBJECT → TEACHER
  // --------------------------------------------------

  const classSubject = await prisma.classSubject.upsert({
    where: {
      classId_subjectId: {
        classId: schoolClass.id,
        subjectId: subject.id,
      },
    },
    update: {
      teacherId: teacher.id,
    },
    create: {
      classId: schoolClass.id,
      subjectId: subject.id,
      teacherId: teacher.id,
    },
  });

  console.log("✅ Mathematics assigned to teacher");

  // --------------------------------------------------
  // STUDENT
  // --------------------------------------------------

  let student = await prisma.student.findUnique({
    where: {
      studentNumber: "STU001",
    },
  });

  if (!student) {
    student = await prisma.student.create({
      data: {
        studentNumber: "STU001",
        firstName: "Michael",
        lastName: "Student",
        gender: "Male",
        email: "student@edunova.com",
        guardianName: "Sarah Parent",
        guardianPhone: "0200000001",
        classId: schoolClass.id,
        schoolId: school.id,
      },
    });

    console.log("✅ Student created");
  } else {
    student = await prisma.student.update({
      where: {
        id: student.id,
      },
      data: {
        email: "student@edunova.com",
        classId: schoolClass.id,
        schoolId: school.id,
      },
    });

    console.log("✅ Student already exists");
  }

  // --------------------------------------------------
  // PARENT
  // --------------------------------------------------

  let parent = await prisma.parent.findFirst({
    where: {
      email: "parent@edunova.com",
      schoolId: school.id,
    },
  });

  if (!parent) {
    parent = await prisma.parent.create({
      data: {
        firstName: "Sarah",
        lastName: "Parent",
        email: "parent@edunova.com",
        phone: "0200000001",
        schoolId: school.id,
      },
    });

    console.log("✅ Parent created");
  } else {
    parent = await prisma.parent.update({
      where: {
        id: parent.id,
      },
      data: {
        schoolId: school.id,
      },
    });

    console.log("✅ Parent already exists");
  }

  // --------------------------------------------------
  // PARENT → STUDENT
  // --------------------------------------------------

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: student.id,
      },
    },
    update: {
      relationship: "Parent",
      isPrimary: true,
    },
    create: {
      parentId: parent.id,
      studentId: student.id,
      relationship: "Parent",
      isPrimary: true,
    },
  });

  console.log("✅ Parent connected to Michael Student");

  // --------------------------------------------------
  // USERS
  // --------------------------------------------------

  // ADMIN
  await prisma.user.upsert({
    where: {
      email: "admin@edunova.com",
    },
    update: {
      role: "ADMIN",
      schoolId: school.id,
      active: true,
      studentId: null,
      teacherId: null,
      parentId: null,
    },
    create: {
      email: "admin@edunova.com",
      passwordHash: hashPassword("admin123"),
      firstName: "System",
      lastName: "Administrator",
      role: "ADMIN",
      schoolId: school.id,
      active: true,
    },
  });

  // TEACHER
  await prisma.user.upsert({
    where: {
      email: "teacher@edunova.com",
    },
    update: {
      role: "TEACHER",
      schoolId: school.id,
      teacherId: teacher.id,
      studentId: null,
      parentId: null,
      active: true,
    },
    create: {
      email: "teacher@edunova.com",
      passwordHash: hashPassword("teacher123"),
      firstName: "John",
      lastName: "Teacher",
      role: "TEACHER",
      schoolId: school.id,
      teacherId: teacher.id,
      active: true,
    },
  });

  // STUDENT
  await prisma.user.upsert({
    where: {
      email: "student@edunova.com",
    },
    update: {
      role: "STUDENT",
      schoolId: school.id,
      studentId: student.id,
      teacherId: null,
      parentId: null,
      active: true,
    },
    create: {
      email: "student@edunova.com",
      passwordHash: hashPassword("student123"),
      firstName: "Michael",
      lastName: "Student",
      role: "STUDENT",
      schoolId: school.id,
      studentId: student.id,
      active: true,
    },
  });

  // PARENT
  await prisma.user.upsert({
    where: {
      email: "parent@edunova.com",
    },
    update: {
      role: "PARENT",
      schoolId: school.id,
      parentId: parent.id,
      studentId: null,
      teacherId: null,
      active: true,
    },
    create: {
      email: "parent@edunova.com",
      passwordHash: hashPassword("parent123"),
      firstName: "Sarah",
      lastName: "Parent",
      role: "PARENT",
      schoolId: school.id,
      parentId: parent.id,
      active: true,
    },
  });

  console.log("✅ User accounts connected");
  console.log("");
  console.log("🎉 EduNova seed completed successfully.");
  console.log("");
  console.log("Connected accounts:");
  console.log("Admin   → admin@edunova.com");
  console.log("Teacher → teacher@edunova.com → John Teacher");
  console.log("Student → student@edunova.com → Michael Student");
  console.log("Parent  → parent@edunova.com → Sarah Parent");
  console.log("Parent  → Michael Student");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });