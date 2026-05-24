const ablyApiKey = 'Keoj6A.VJFchg:-QfcCp6h_kDs7_ZwJj6APJGcPu4lR4wKP1zhZ-Njxfw';
const [keyName, keySecret] = ablyApiKey.split(':');
const tokenParams = {
  keyName: keyName,
  clientId: 'test-user',
  capability: JSON.stringify({
    "world-chat": ["subscribe", "presence"]
  }),
  ttl: 7200000,
  timestamp: Date.now()
};

fetch(`https://rest.ably.io/keys/${keyName}/requestToken`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(ablyApiKey)}`
  },
  body: JSON.stringify(tokenParams)
}).then(res => res.text()).then(console.log);
