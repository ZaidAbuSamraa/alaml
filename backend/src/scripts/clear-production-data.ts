import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'alaml',
});

async function clearProductionData() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    console.log('\n⚠️  WARNING: This will delete all production data!');
    console.log('📋 The following data will be deleted:');
    console.log('   - All payments');
    console.log('   - All invoices');
    console.log('   - All transactions');
    console.log('   - All suppliers');
    console.log('   - All time logs');
    console.log('   - All resource requests');
    console.log('   - All notifications');
    console.log('   - All employees');
    console.log('   - All sales');
    console.log('   - All cash records\n');

    // Disable foreign key checks
    await AppDataSource.query("SET session_replication_role = 'replica'");

    console.log('🗑️  Deleting notifications...');
    await AppDataSource.query('DELETE FROM notifications');

    console.log('🗑️  Deleting resource requests...');
    await AppDataSource.query('DELETE FROM resource_requests');

    console.log('🗑️  Deleting time logs...');
    await AppDataSource.query('DELETE FROM time_logs');

    console.log('🗑️  Deleting employees...');
    await AppDataSource.query('DELETE FROM employees');

    console.log('🗑️  Deleting transactions...');
    await AppDataSource.query('DELETE FROM transactions');

    console.log('🗑️  Deleting payments...');
    await AppDataSource.query('DELETE FROM payments');

    console.log('🗑️  Deleting invoices...');
    await AppDataSource.query('DELETE FROM invoices');

    console.log('🗑️  Deleting suppliers...');
    await AppDataSource.query('DELETE FROM suppliers');

    console.log('🗑️  Deleting sales...');
    await AppDataSource.query('DELETE FROM sales');

    console.log('🗑️  Deleting cash records...');
    await AppDataSource.query('DELETE FROM cash');

    // Reset sequences
    console.log('\n🔄 Resetting auto-increment sequences...');
    const sequences = [
      'notifications_id_seq',
      'resource_requests_id_seq',
      'time_logs_id_seq',
      'employees_id_seq',
      'transactions_id_seq',
      'payments_id_seq',
      'invoices_id_seq',
      'suppliers_id_seq',
      'sales_id_seq',
      'cash_id_seq',
    ];

    for (const seq of sequences) {
      try {
        await AppDataSource.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
        console.log(`   ✓ Reset ${seq}`);
      } catch (err) {
        console.log(`   ⚠ Sequence ${seq} not found (skipped)`);
      }
    }

    // Re-enable foreign key checks
    await AppDataSource.query("SET session_replication_role = 'origin'");

    console.log('\n✅ Production data cleared successfully!');
    console.log('📊 Database is now ready for production deployment');
    console.log('ℹ️  Note: Admin user accounts are preserved\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing production data:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

clearProductionData();
