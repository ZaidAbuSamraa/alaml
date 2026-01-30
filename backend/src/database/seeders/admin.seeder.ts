import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';

export async function seedAdmin(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const adminExists = await userRepository.findOne({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = userRepository.create({
      username: 'admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await userRepository.save(admin);
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
  } else {
    console.log('Admin user already exists');
  }
}
