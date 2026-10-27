/**
 * Built-in word lists, written for this project.
 * Every entry is one lowercase word without spaces. Turkish words use the
 * Turkish alphabet (ç ğ ı ö ş ü) and are stored in Unicode NFC form, so a
 * dotless "ı" and a dotted "i" are different characters.
 */

const ENGLISH = Object.freeze([
  'a', 'about', 'add', 'after', 'again', 'air', 'all', 'also', 'always', 'an',
  'and', 'animal', 'are', 'around', 'as', 'ask', 'at', 'away', 'back', 'be',
  'because', 'been', 'before', 'begin', 'best', 'better', 'big', 'bird',
  'black', 'blue', 'boat', 'body', 'book', 'build', 'but', 'by', 'call', 'can',
  'car', 'change', 'child', 'city', 'clean', 'cold', 'color', 'come', 'could',
  'day', 'did', 'do', 'dog', 'down', 'each', 'easy', 'eat', 'end', 'even',
  'every', 'eye', 'face', 'family', 'far', 'fast', 'feel', 'few', 'find',
  'fire', 'first', 'fish', 'five', 'fly', 'food', 'for', 'free', 'friend',
  'from', 'full', 'game', 'get', 'give', 'go', 'good', 'great', 'green',
  'grow', 'had', 'hand', 'happy', 'hard', 'has', 'have', 'he', 'head', 'hear',
  'heart', 'help', 'her', 'here', 'high', 'him', 'his', 'home', 'hope',
  'horse', 'house', 'how', 'idea', 'if', 'in', 'into', 'is', 'it', 'its',
  'just', 'keep', 'kind', 'know', 'land', 'last', 'learn', 'left', 'life',
  'light', 'like', 'line', 'little', 'live', 'long', 'look', 'made', 'make',
  'many', 'may', 'me', 'mind', 'money', 'moon', 'more', 'most', 'move', 'much',
  'music', 'must', 'my', 'name', 'need', 'never', 'new', 'next', 'night', 'no',
  'not', 'now', 'number', 'of', 'old', 'on', 'one', 'only', 'open', 'or',
  'other', 'our', 'out', 'over', 'part', 'people', 'place', 'play', 'put',
  'quick', 'rain', 'read', 'right', 'river', 'road', 'room', 'run', 'said',
  'same', 'say', 'school', 'sea', 'see', 'she', 'ship', 'should', 'show',
  'sleep', 'small', 'snow', 'so', 'some', 'song', 'star', 'start', 'story',
  'street', 'sun', 'take', 'tell', 'than', 'that', 'the', 'their', 'them',
  'then', 'there', 'these', 'they', 'thing', 'think', 'this', 'three', 'time',
  'to', 'today', 'tree', 'true', 'try', 'turn', 'two', 'under', 'up', 'use',
  'very', 'walk', 'want', 'was', 'water', 'way', 'we', 'well', 'were', 'what',
  'when', 'where', 'which', 'white', 'who', 'will', 'with', 'word', 'work',
  'world', 'would', 'write', 'year', 'you', 'your',
]);

const TURKISH = Object.freeze([
  've', 'bir', 'bu', 'o', 'da', 'de', 'ile', 'için', 'çok', 'az', 'ne', 'gibi',
  'daha', 'ama', 'kadar', 'sonra', 'önce', 'şey', 'var', 'yok', 'en', 'her',
  'hiç', 'hep', 'bile', 'yine', 'belki', 'evet', 'hayır', 'tamam', 'ben',
  'sen', 'biz', 'siz', 'onlar', 'kendi', 'göre', 'iyi', 'kötü', 'büyük',
  'küçük', 'yeni', 'eski', 'uzun', 'kısa', 'güzel', 'zaman', 'gün', 'yıl',
  'ay', 'hafta', 'saat', 'dakika', 'sabah', 'akşam', 'gece', 'bugün', 'yarın',
  'dün', 'şimdi', 'hemen', 'artık', 'insan', 'adam', 'kadın', 'çocuk', 'anne',
  'baba', 'kardeş', 'arkadaş', 'aile', 'ev', 'oda', 'kapı', 'pencere', 'masa',
  'yatak', 'bahçe', 'yol', 'sokak', 'şehir', 'köy', 'ülke', 'dünya', 'deniz',
  'göl', 'nehir', 'dağ', 'orman', 'ağaç', 'çiçek', 'taş', 'su', 'hava', 'ateş',
  'güneş', 'yıldız', 'bulut', 'yağmur', 'kar', 'soğuk', 'sıcak', 'ılık',
  'renk', 'kırmızı', 'mavi', 'yeşil', 'sarı', 'beyaz', 'siyah', 'mor', 'el',
  'ayak', 'baş', 'göz', 'kulak', 'ağız', 'yüz', 'saç', 'kol', 'kalp', 'ses',
  'söz', 'kelime', 'cümle', 'dil', 'kitap', 'kalem', 'okul', 'öğretmen',
  'öğrenci', 'ders', 'sınav', 'soru', 'cevap', 'bilgi', 'fikir', 'düşünce',
  'iş', 'para', 'pazar', 'ekmek', 'süt', 'çay', 'kahve', 'şeker', 'tuz', 'et',
  'balık', 'tavuk', 'meyve', 'elma', 'üzüm', 'yemek', 'içmek', 'gelmek',
  'gitmek', 'yapmak', 'etmek', 'olmak', 'görmek', 'bakmak', 'bilmek',
  'istemek', 'sevmek', 'almak', 'vermek', 'demek', 'söylemek', 'konuşmak',
  'okumak', 'yazmak', 'dinlemek', 'anlamak', 'düşünmek', 'çalışmak', 'oynamak',
  'koşmak', 'yürümek', 'uyumak', 'açmak', 'başlamak', 'beklemek', 'aramak',
  'bulmak', 'sormak', 'öğrenmek', 'kalmak', 'girmek', 'çıkmak', 'dönmek',
  'sevgi', 'mutluluk', 'hayat', 'sağlık', 'doktor', 'ilaç', 'araba', 'otobüs',
  'tren', 'uçak', 'gemi', 'yolculuk', 'tatil', 'müzik', 'şarkı', 'resim',
  'film', 'oyun', 'hızlı', 'yavaş', 'kolay', 'zor', 'doğru', 'yanlış', 'açık',
  'kapalı', 'temiz', 'dolu', 'boş', 'ağır', 'hafif', 'yüksek', 'geniş',
  'derin', 'genç', 'yaşlı', 'mutlu', 'yorgun', 'ışık', 'karanlık', 'umut',
  'cesaret', 'merak', 'şans', 'başarı', 'değer', 'önemli', 'gerçek', 'doğa',
  'hayvan', 'kedi', 'köpek', 'kuş', 'at', 'arı', 'ayı', 'kurt', 'aslan',
  'kaplumbağa',
]);

/**
 * Word lists by language code ("en" or "tr").
 * @type {Readonly<Record<'en' | 'tr', readonly string[]>>}
 */
export const WORD_LISTS = Object.freeze({ en: ENGLISH, tr: TURKISH });
