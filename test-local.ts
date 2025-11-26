import { pool, testConnection } from './src/database/connection';

async function testAll() {
  console.log('🧪 INICIANDO TESTES LOCAIS...\n');

  // Teste 1: Conexão com o banco
  console.log('1. Testando conexão com PostgreSQL...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.log('❌ FALHA: Não consegui conectar ao PostgreSQL');
    process.exit(1);
  }
  console.log('✅ Conexão com PostgreSQL OK!\n');

  // Teste 2: Verificar se tabela existe (AGORA PULA A CRIAÇÃO)
  console.log('2. Verificando se a tabela users existe...');
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ A tabela users não existe ou não tem permissão');
      console.log('   A tabela foi criada como usuário postgres');
      console.log('   Execute estes comandos como postgres:');
      console.log(`
        psql -U postgres -c "GRANT ALL PRIVILEGES ON TABLE users TO auth_user;"
        psql -U postgres -c "GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO auth_user;"
      `);
      process.exit(1);
    }
    
    console.log('✅ Tabela users encontrada com colunas:');
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    console.log('');

  } catch (error: any) {
    console.log('❌ Erro ao verificar tabela:', error.message);
    if (error.code === '42501') {
      console.log('   💡 SOLUÇÃO: Execute os comandos de permissão acima');
    }
    process.exit(1);
  }

  // Teste 3: Teste de inserção (AGORA DEVE FUNCIONAR)
  console.log('3. Testando inserção de usuário...');
  try {
    const bcrypt = require('bcryptjs');
    const testPassword = await bcrypt.hash('123456', 12);
    
    // Use um email único para cada teste
    const testEmail = `test${Date.now()}@example.com`;
    
    const insertResult = await pool.query(`
      INSERT INTO users (email, password, name) 
      VALUES ($1, $2, $3) 
      RETURNING id, email, name, created_at
    `, [testEmail, testPassword, 'Usuário Teste']);

    console.log('✅ Inserção OK - Usuário criado:');
    console.log(`   ID: ${insertResult.rows[0].id}`);
    console.log(`   Email: ${insertResult.rows[0].email}`);
    console.log(`   Nome: ${insertResult.rows[0].name}`);
    
    // Limpar teste
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('✅ Usuário de teste removido\n');

  } catch (error: any) {
    console.log('❌ Erro na inserção:', error.message);
    if (error.code === '42501') {
      console.log('   💡 SOLUÇÃO: Permissão negada. Execute:');
      console.log('   GRANT ALL PRIVILEGES ON TABLE users TO auth_user;');
    }
    process.exit(1);
  }

  console.log('🎉 TODOS OS TESTES PASSARAM!');
  console.log('🚀 Agora pode iniciar o servidor: npm run dev');
  
  await pool.end();
  process.exit(0);
}

testAll();