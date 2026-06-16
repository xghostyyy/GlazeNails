import { PrismaClient, type Specialty } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { addDays, subDays, setHours, setMinutes } from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Studio Settings ───────────────────────────────────────────────────────
  await prisma.studioSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      slotGranularity: 15,
      bufferAfterMin: 15,
      minLeadHours: 2,
      maxAdvanceDays: 45,
      cancelCutoffH: 24,
      timezone: "Europe/Amsterdam",
    },
  });

  // ─── Services ─────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.service.upsert({
      where: { id: "svc-manicure-classic" },
      update: {},
      create: { id: "svc-manicure-classic", name: "Классический маникюр с покрытием", category: "MANICURE", durationMin: 60, priceCents: 250000, description: "Обработка, форма, покрытие гель-лаком", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-manicure-design" },
      update: {},
      create: { id: "svc-manicure-design", name: "Маникюр с дизайном", category: "MANICURE", durationMin: 90, priceCents: 350000, description: "Маникюр + авторский дизайн по договорённости", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-manicure-spa" },
      update: {},
      create: { id: "svc-manicure-spa", name: "Spa-маникюр", category: "MANICURE", durationMin: 75, priceCents: 320000, description: "Маникюр с парафинотерапией и массажем рук", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-pedicure-classic" },
      update: {},
      create: { id: "svc-pedicure-classic", name: "Классический педикюр", category: "PEDICURE", durationMin: 75, priceCents: 300000, description: "Обработка стоп, форма, покрытие", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-pedicure-hardware" },
      update: {},
      create: { id: "svc-pedicure-hardware", name: "Аппаратный педикюр", category: "PEDICURE", durationMin: 90, priceCents: 380000, description: "Аппаратная обработка + покрытие гель-лаком", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-pedicure-spa" },
      update: {},
      create: { id: "svc-pedicure-spa", name: "Spa-педикюр", category: "PEDICURE", durationMin: 105, priceCents: 450000, description: "Педикюр с ванночкой, маской и массажем стоп", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-design-nail-art" },
      update: {},
      create: { id: "svc-design-nail-art", name: "Нейл-арт", category: "DESIGN", durationMin: 30, priceCents: 50000, description: "Авторский дизайн от 1 ногтя", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-design-ombre" },
      update: {},
      create: { id: "svc-design-ombre", name: "Омбре и градиент", category: "DESIGN", durationMin: 45, priceCents: 80000, description: "Плавный переход цвета на всех ногтях", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-extension-gel" },
      update: {},
      create: { id: "svc-extension-gel", name: "Наращивание гелем", category: "EXTENSION", durationMin: 120, priceCents: 500000, description: "Наращивание на типсах или формах", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-extension-acrylic" },
      update: {},
      create: { id: "svc-extension-acrylic", name: "Наращивание акрилом", category: "EXTENSION", durationMin: 120, priceCents: 480000, description: "Прочное акриловое наращивание", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-removal-gel" },
      update: {},
      create: { id: "svc-removal-gel", name: "Снятие гель-лака", category: "REMOVAL", durationMin: 30, priceCents: 70000, description: "Безопасное снятие покрытия с уходом", isActive: true },
    }),
    prisma.service.upsert({
      where: { id: "svc-removal-extension" },
      update: {},
      create: { id: "svc-removal-extension", name: "Снятие наращивания", category: "REMOVAL", durationMin: 45, priceCents: 90000, description: "Снятие гелевых или акриловых ногтей", isActive: true },
    }),
  ]);

  // ─── Admin user ───────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@glaze.studio" },
    update: {},
    create: {
      id: "user-admin",
      email: "admin@glaze.studio",
      name: "Владелец Студии",
      role: "ADMIN",
      passwordHash: await hash("admin123"),
    },
  });

  // ─── Demo client ──────────────────────────────────────────────────────────
  const client = await prisma.user.upsert({
    where: { email: "client@glaze.studio" },
    update: {},
    create: {
      id: "user-client",
      email: "client@glaze.studio",
      name: "Алина Волкова",
      phone: "+31612345678",
      role: "CLIENT",
      passwordHash: await hash("client123"),
    },
  });

  // ─── Masters ──────────────────────────────────────────────────────────────
  const masterData = [
    { id: "user-anna", email: "anna@glaze.studio", name: "Анна Козлова", bio: "5 лет опыта. Специализируюсь на сложных дизайнах и наращивании.", specialties: ["MANICURE", "DESIGN", "EXTENSION"] as const, services: ["svc-manicure-classic", "svc-manicure-design", "svc-design-nail-art", "svc-design-ombre", "svc-extension-gel", "svc-removal-gel"] },
    { id: "user-maria", email: "maria@glaze.studio", name: "Мария Рябова", bio: "Мастер педикюра с медицинским образованием. Безопасность прежде всего.", specialties: ["PEDICURE", "MANICURE"] as const, services: ["svc-pedicure-classic", "svc-pedicure-hardware", "svc-pedicure-spa", "svc-manicure-classic", "svc-removal-gel"] },
    { id: "user-kate", email: "kate@glaze.studio", name: "Екатерина Смирнова", bio: "Художник ногтей. Каждая запись — произведение искусства.", specialties: ["DESIGN", "MANICURE", "EXTENSION"] as const, services: ["svc-manicure-design", "svc-manicure-spa", "svc-design-nail-art", "svc-design-ombre", "svc-extension-acrylic", "svc-removal-extension"] },
    { id: "user-olga", email: "olga@glaze.studio", name: "Ольга Петрова", bio: "Универсальный мастер. Качество в каждой детали.", specialties: ["MANICURE", "PEDICURE"] as const, services: ["svc-manicure-classic", "svc-manicure-design", "svc-pedicure-classic", "svc-removal-gel", "svc-removal-extension"] },
    { id: "user-lena", email: "lena@glaze.studio", name: "Елена Фёдорова", bio: "Spa-уход и классический маникюр. Атмосфера relax.", specialties: ["MANICURE", "PEDICURE"] as const, services: ["svc-manicure-spa", "svc-manicure-classic", "svc-pedicure-spa", "svc-pedicure-classic"] },
    { id: "user-yulia", email: "yulia@glaze.studio", name: "Юлия Иванова", bio: "Специалист по наращиванию и коррекции. Ногти вашей мечты.", specialties: ["EXTENSION", "REMOVAL", "MANICURE"] as const, services: ["svc-extension-gel", "svc-extension-acrylic", "svc-removal-gel", "svc-removal-extension", "svc-manicure-classic"] },
  ];

  const masters = [];
  for (const md of masterData) {
    const user = await prisma.user.upsert({
      where: { email: md.email },
      update: {},
      create: {
        id: md.id,
        email: md.email,
        name: md.name,
        role: "MASTER",
        passwordHash: await hash("master123"),
      },
    });

    const profile = await prisma.masterProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        id: `mp-${md.id}`,
        userId: user.id,
        bio: md.bio,
        specialties: [...md.specialties] as Specialty[],
        canTakeBookings: true,
        ratingAvg: 4.7 + Math.random() * 0.3,
        ratingCount: Math.floor(50 + Math.random() * 100),
        services: { connect: md.services.map((id) => ({ id })) },
      },
    });

    // Working hours: Mon–Fri 10:00–19:00, Sat 11:00–17:00
    const weekdays = md.id === "user-anna" || md.id === "user-kate" ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
    for (const weekday of weekdays) {
      const startMin = weekday === 6 ? 660 : 600; // Sat: 11:00, weekdays: 10:00
      const endMin = weekday === 6 ? 1020 : 1140; // Sat: 17:00, weekdays: 19:00
      await prisma.workingHours.upsert({
        where: { id: `wh-${profile.id}-${weekday}` },
        update: {},
        create: { id: `wh-${profile.id}-${weekday}`, masterId: profile.id, weekday, startMin, endMin },
      });
    }

    masters.push({ user, profile });
  }

  // ─── Demo appointments (past = COMPLETED, future = PENDING/CONFIRMED) ──────
  const now = new Date();
  const [anna] = masters;

  // Past appointment 1 — COMPLETED (for review)
  const appt1 = await prisma.appointment.upsert({
    where: { id: "appt-demo-1" },
    update: {},
    create: {
      id: "appt-demo-1",
      clientId: client.id,
      masterId: anna.profile.id,
      serviceId: "svc-manicure-design",
      startsAt: setMinutes(setHours(subDays(now, 7), 11), 0),
      endsAt: setMinutes(setHours(subDays(now, 7), 12), 30),
      status: "COMPLETED",
      clientNote: "Хочу что-то нежное в розово-лиловых тонах",
    },
  });

  // Past appointment 2 — COMPLETED
  await prisma.appointment.upsert({
    where: { id: "appt-demo-2" },
    update: {},
    create: {
      id: "appt-demo-2",
      clientId: client.id,
      masterId: masters[1].profile.id,
      serviceId: "svc-pedicure-classic",
      startsAt: setMinutes(setHours(subDays(now, 14), 14), 0),
      endsAt: setMinutes(setHours(subDays(now, 14), 15), 15),
      status: "COMPLETED",
    },
  });

  // Future appointment — CONFIRMED
  await prisma.appointment.upsert({
    where: { id: "appt-demo-3" },
    update: {},
    create: {
      id: "appt-demo-3",
      clientId: client.id,
      masterId: anna.profile.id,
      serviceId: "svc-manicure-classic",
      startsAt: setMinutes(setHours(addDays(now, 3), 10), 0),
      endsAt: setMinutes(setHours(addDays(now, 3), 11), 0),
      status: "CONFIRMED",
    },
  });

  // Pending appointment
  await prisma.appointment.upsert({
    where: { id: "appt-demo-4" },
    update: {},
    create: {
      id: "appt-demo-4",
      clientId: client.id,
      masterId: masters[2].profile.id,
      serviceId: "svc-design-nail-art",
      startsAt: setMinutes(setHours(addDays(now, 5), 15), 0),
      endsAt: setMinutes(setHours(addDays(now, 5), 15), 30),
      status: "PENDING",
    },
  });

  // ─── Demo reviews ─────────────────────────────────────────────────────────
  await prisma.review.upsert({
    where: { appointmentId: appt1.id },
    update: {},
    create: {
      id: "review-demo-1",
      appointmentId: appt1.id,
      clientId: client.id,
      rating: 5,
      text: "Анна сделала потрясающий дизайн — именно то, что я хотела! Буду приходить снова.",
      photoUrls: [],
      isPublished: true,
    },
  });

  console.log("✅ Seed complete!");
  console.log("   Admin: admin@glaze.studio / admin123");
  console.log("   Client: client@glaze.studio / client123");
  console.log("   Masters: anna@glaze.studio / master123 (and 5 more)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
