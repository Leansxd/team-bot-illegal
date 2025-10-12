
const Emojis = {
  hello: { name: 'hello', id: '1409668204707581972' },
  warn: { name: 'warn', id: '1409668194754625566' },
  tik: { name: 'tik', id: '1409668181869723889' }, 
  not: { name: 'not', id: '1409668113775067186' },
  confetti: { name: 'confetti', id: '1409668096683147377' }
};

function e(key) {
  const item = Emojis[key];
  if (!item) return '';
  return `<:${item.name}:${item.id}>`;
}

module.exports = { Emojis, e };
