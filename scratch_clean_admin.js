const fs = require('fs');

function cleanAdmin() {
  let content = fs.readFileSync('src/server/routers/admin.ts', 'utf8');

  // 1. Remove VendorStatus and PayoutStatus
  content = content.replace('VendorStatus, ', '');
  content = content.replace('PayoutStatus, ', ''); // if any

  // 2. stats
  content = content.replace(/const totalVendors = await ctx\.prisma\.vendor\.count\(\{ where: \{ status: 'APPROVED' \} \}\);/, '');
  content = content.replace(/const pendingVendors = await ctx\.prisma\.vendor\.count\(\{ where: \{ status: 'PENDING' \} \}\);/, '');
  content = content.replace(/const pendingPayouts = await ctx\.prisma\.vendor\.aggregate\(\{\s*_sum: \{ pendingPayout: true \},\s*\}\);/, '');
  content = content.replace(/totalVendors,\s*pendingVendors,/, '');
  content = content.replace(/pendingPayouts: pendingPayouts\._sum\.pendingPayout \?\? 0,/, '');
  content = content.replace(/platformRevenue: platformRevenue\._sum\.commission \?\? 0,/, 'platformRevenue: platformRevenue._sum.total ?? 0,');
  content = content.replace(/_sum: \{ commission: true \},/g, '_sum: { total: true },');
  content = content.replace(/CAST\(SUM\(commission\) AS FLOAT8\) as revenue/, 'CAST(SUM(total) AS FLOAT8) as revenue');

  // 3. vendorAnalytics
  const vAStart = content.indexOf('vendorAnalytics: adminProcedure');
  if (vAStart !== -1) {
    const vAEnd = content.indexOf('platformAnalytics: adminProcedure');
    if (vAEnd !== -1) {
      content = content.slice(0, content.lastIndexOf('/**', vAStart)) + content.slice(content.lastIndexOf('/**', vAEnd));
    }
  }

  // 4. platformAnalytics
  content = content.replace(/let newVendors = 0;/g, '');
  content = content.replace(/\[newUsers, newVendors\] = await Promise\.all\(\[/g, 'newUsers = await ctx.prisma.user.count({ where: { createdAt: { gte: since }, role: \'CUSTOMER\' } });');
  content = content.replace(/ctx\.prisma\.user\.count\(\{ where: \{ createdAt: \{ gte: since \}, role: 'CUSTOMER' \} \}\),/g, '');
  content = content.replace(/ctx\.prisma\.vendor\.count\(\{ where: \{ createdAt: \{ gte: since \} \} \},/g, '');
  content = content.replace(/\]\);/g, '');
  content = content.replace(/newVendors,/g, '');
  
  const topVendorsQuery = `const topVendors = await ctx.prisma.order.groupBy({
          by: ['vendorId'],
          where: { paymentStatus: 'PAID', createdAt: { gte: since } },
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 5,
        }),`;
  content = content.replace(/const \[orderAgg, topVendors\] = await Promise\.all\(\[/, 'const orderAgg = await ctx.prisma.order.aggregate({');
  content = content.replace(/ctx\.prisma\.order\.aggregate\(\{/, '');
  content = content.replace(/_count: \{ id: true \},\n        \}\),/g, '_count: { id: true },\n        });');
  content = content.replace(/ctx\.prisma\.order\.groupBy\(\{[^]*?take: 5,\n        \}\),/g, '');
  content = content.replace(/const topVendorDetails = await ctx\.prisma\.vendor\.findMany\(\{[^]*?\}\);/g, '');
  content = content.replace(/topVendors: topVendors\.map\([^]*?\}\)\),/g, '');
  content = content.replace(/platformCommission: orderAgg\._sum\.commission \?\? 0,/g, '');

  // 5. vendors to deleteProduct
  const vStart = content.indexOf('vendors: adminProcedure');
  const dStart = content.indexOf('users: adminProcedure');
  if (vStart !== -1 && dStart !== -1) {
    content = content.slice(0, vStart) + content.slice(dStart);
  }

  const pPayoutStart = content.indexOf('processPayout: adminProcedure');
  const getConfigStart = content.indexOf('getConfig: protectedProcedure');
  if (pPayoutStart !== -1 && getConfigStart !== -1) {
    content = content.slice(0, pPayoutStart) + content.slice(getConfigStart);
  }

  // 6. products
  content = content.replace(/vendorId: z\.string\(\)\.optional\(\),/g, '');
  content = content.replace(/vendorId,/g, '');
  content = content.replace(/vendor: \{ select: \{ shopName: true, city: true, commissionRate: true \} \},/g, '');

  // 7. createProduct
  content = content.replace(/vendorId: z\.string\(\),/g, '');
  content = content.replace(/commissionRate: z\.number\(\)\.min\(0\)\.max\(1\)\.optional\(\),/g, '');
  const vendorCheckProduct = `const vendor = await ctx.prisma.vendor.findUnique({ where: { id: input.vendorId } });
      if (!vendor) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Vendor not found.' });
      }`;
  content = content.replace(vendorCheckProduct, '');
  content = content.replace(/vendorId: input\.vendorId,/g, '');
  content = content.replace(/commissionRate: input\.commissionRate,/g, '');

  // 8. updateProduct
  content = content.replace(/commissionRate: z\.number\(\)\.min\(0\)\.max\(1\)\.optional\(\),/g, '');

  // 9. updateOrderStatus
  const updateOrderVendor = `if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
          await tx.vendor.update({
            where: { id: order.vendorId },
            data: {
              pendingPayout: { increment: order.vendorAmount },
            },
          });
        }`;
  content = content.replace(updateOrderVendor, '');

  // 10. verifyOrderPayment
  content = content.replace(/await pusherServer\.trigger\(CHANNELS\.VENDOR\(order\.vendorId\), EVENTS\.STATS_UPDATED, \{\}\); \/\/ Refresh vendor dashboard/g, '');

  // 11. gstReport
  const gstReportStart = content.indexOf('/** GST and Tax Reporting */');
  const createVendorStart = content.indexOf('createVendor: adminProcedure');
  if (gstReportStart !== -1 && createVendorStart !== -1) {
    const newGstReport = `/** GST and Tax Reporting */
  gstReport: adminProcedure
    .input(z.object({ period: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']).default('MONTHLY') }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let since: Date;
      switch (input.period) {
        case 'QUARTERLY':   since = new Date(now.getFullYear(), now.getMonth() - 2, 1); break;
        case 'HALF_YEARLY': since = new Date(now.getFullYear(), now.getMonth() - 5, 1); break;
        case 'ANNUAL':      since = new Date(now.getFullYear() - 1, now.getMonth(), 1); break;
        default:            since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const items = await ctx.prisma.orderItem.findMany({
        where: { order: { paymentStatus: 'PAID', createdAt: { gte: since } } },
        include: { order: { select: { id: true, total: true } } }
      });

      let totalGst = 0;
      let totalTaxable = 0;

      items.forEach(item => {
        const taxable = item.price * item.quantity;
        totalGst += item.gstAmount;
        totalTaxable += taxable;
      });

      return {
        summary: { totalGst, totalTaxable, period: input.period, vendorsCount: 0 },
        vendors: []
      };
    }),

  `;
    content = content.slice(0, gstReportStart) + newGstReport + content.slice(createVendorStart);
  }

  // 12. getPendingVerifications & approvePayment & approveSubscription & createVendor
  const createVendorStart2 = content.indexOf('createVendor: adminProcedure');
  if (createVendorStart2 !== -1) {
    content = content.slice(0, createVendorStart2) + '});\n';
  }

  // 13. Re-add pending verifications correctly
  const pendingVerif = `
  getPendingVerifications: adminProcedure.query(async ({ ctx }) => {
    const pendingOrders = await ctx.prisma.order.findMany({
      where: { paymentStatus: 'PENDING', utrNumber: { not: null } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    return { pendingOrders, pendingSubscriptions: [] };
  }),

  approvePayment: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
       const existingOrder = await ctx.prisma.order.findUnique({
         where: { id: input.orderId },
         select: { paymentStatus: true }
       });
       if (!existingOrder) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });

       return ctx.prisma.$transaction(async (tx) => {
         const order = await tx.order.update({
           where: { id: input.orderId },
           data: {
             paymentStatus: 'PAID',
             status: 'CONFIRMED',
             timeline: {
               create: {
                 status: 'CONFIRMED',
                 message: 'Payment verified manually by admin. Order confirmed.'
               }
             }
           }
         });
         return order;
       });
    }),
`;
  content = content.replace('});\n', pendingVerif + '\n});\n');

  // Fix order include
  content = content.replace(/vendor: \{ select: \{ shopName: true, city: true \} \},/g, '');

  fs.writeFileSync('src/server/routers/admin.ts', content);
}

cleanAdmin();
