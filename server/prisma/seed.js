const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 0. Cleanup existing demo data to prevent unique constraint errors (Idempotent seed)
    await prisma.approvalLog.deleteMany({});
    await prisma.expenseAttachment.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.approvalRuleApprover.deleteMany({});
    await prisma.approvalRule.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin@demo.com', 'manager@demo.com', 'employee@demo.com'] }
      }
    });
    // For company we can try to find existing or create new
    
    let company = await prisma.company.findFirst({
      where: { name: 'Odoo x VIT Demo Corp' }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Odoo x VIT Demo Corp',
          country: 'India',
          baseCurrency: 'INR',
        },
      });
      console.log(`✅ Created Company: ${company.name}`);
    } else {
      console.log(`✅ Found existing Company: ${company.name}`);
    }

    // 2. Hash default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 3. Create Users (Admin, Manager, Employee) using upsert to avoid conflicts
    const admin = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        companyId: company.id,
        name: 'Alice Admin',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Created/Verified Admin User: ${admin.email}`);

    const manager = await prisma.user.upsert({
      where: { email: 'manager@demo.com' },
      update: {},
      create: {
        companyId: company.id,
        name: 'Bob Manager',
        email: 'manager@demo.com',
        password: hashedPassword,
        role: 'MANAGER',
      },
    });
    console.log(`✅ Created/Verified Manager User: ${manager.email}`);

    const employee = await prisma.user.upsert({
      where: { email: 'employee@demo.com' },
      update: {},
      create: {
        companyId: company.id,
        name: 'Charlie Employee',
        email: 'employee@demo.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        managerId: manager.id,
      },
    });
    console.log(`✅ Created/Verified Employee User: ${employee.email}`);

    // 4. Create an Approval Rule for the employee
    const rule = await prisma.approvalRule.create({
      data: {
        companyId: company.id,
        userId: employee.id,
        description: 'Standard Travel Expense Rule',
        managerId: manager.id,
        isManagerApprover: true,
        isSequential: true,
        minApprovalPercentage: 100,
        approvers: {
          create: [
             {
               userId: admin.id,
               sequenceOrder: 2,
               isRequired: true
             }
          ]
        }
      }
    });
    console.log(`✅ Created Approval Rule for ${employee.name}`);

    // 5. Create some dummy expenses for the employee
    await prisma.expense.create({
      data: {
        userId: employee.id,
        companyId: company.id,
        description: 'Flight to Delhi',
        category: 'Travel',
        amount: 5000,
        currency: 'INR',
        convertedAmount: 5000,
        expenseDate: new Date(),
        paidBy: 'Employee (Out of pocket)',
        status: 'DRAFT'
      }
    });

    console.log(`✅ Created sample Draft Expense`);

    console.log('🎉 Seeding successfully completed!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
