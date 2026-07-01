const https = require('https');

const N8N_BASE = 'n8n.novohorizonte.com';

function postWebhook(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: N8N_BASE,
      port: 443,
      path: `/webhook/${path}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', e => resolve({ status: 'ERROR', body: e.message }));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('\n=== TESTANDO FLUXOS N8N ===\n');

  // Fluxo 5 - Link Assinatura Pos-Entrega
  const r5 = await postWebhook('sst-signature-link', {
    delivery: { id: 'del_test001', employeeName: 'Emerson Torres', ppeName: 'Capacete de Segurança CA-123', signatureLink: 'https://sst.novohorizonte.com/assinar/test001' },
    employee: { phone: '44999999999', email: 'ti@novohorizonte.com' }
  });
  console.log(`✅ Fluxo 5 (Assinatura Pós-Entrega): HTTP ${r5.status}`);
  console.log(`   → ${r5.body.substring(0, 120)}\n`);

  // Fluxo 8 - Convite CIPA
  const r8 = await postWebhook('sst-cipa-invite', {
    phone: '44999999999',
    email: 'ti@novohorizonte.com',
    name: 'Emerson Torres',
    inviteUrl: 'https://sst.novohorizonte.com/cipa/votar/test',
    actionType: 'invite'
  });
  console.log(`✅ Fluxo 8 (Convite CIPA): HTTP ${r8.status}`);
  console.log(`   → ${r8.body.substring(0, 120)}\n`);

  // Fluxo 9 - Confirmacao Pre-Entrega
  const r9 = await postWebhook('sst-epi-confirm-link', {
    employeeName: 'Emerson Torres',
    phone: '44999999999',
    email: 'ti@novohorizonte.com',
    ppeName: 'Luva de Proteção',
    caNumber: '28932',
    quantity: 2,
    confirmUrl: 'https://sst.novohorizonte.com/confirmar/test001'
  });
  console.log(`✅ Fluxo 9 (Confirmação Pré-Entrega): HTTP ${r9.status}`);
  console.log(`   → ${r9.body.substring(0, 120)}\n`);

  console.log('=== CONCLUÍDO ===');
  console.log('Se todos retornaram 200, WhatsApp e email foram disparados para ti@novohorizonte.com / 44999999999');
}

run();
