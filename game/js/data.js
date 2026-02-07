// ゲーム設定
export const CONFIG = {
  BASE_WIDTH: 400,
  BASE_HEIGHT: 700,
  RACE_GOAL: 3000,
  ANO_HITO_THRESHOLD: 1000,
  CLEAR_MONEY: 5000,
  KICK_MIN: 10,
  KICK_MAX: 50,
  COMBO_TIMEOUT: 800,
  COMBO_BONUS: 0.3,
  ROAD_LANES: 3,
  ROAD_LANE_WIDTH: 80,
  ROAD_MARGIN: 80,
};

export const VEHICLES = {
  car:       { emoji: '🚗', name: '車',           speed: 4,   hitW: 40, hitH: 50 },
  bike:      { emoji: '🏍️', name: 'バイク',       speed: 5.5, hitW: 28, hitH: 45 },
  sportsCar: { emoji: '🏎️', name: 'スポーツカー', speed: 6,   hitW: 40, hitH: 50 },
  bigBike:   { emoji: '🏍️', name: '大型バイク',   speed: 7,   hitW: 28, hitH: 45 },
  racingCar: { emoji: '🏎️', name: 'レーシングカー', speed: 8, hitW: 36, hitH: 48 },
};

export const SHOP_ITEMS = [
  { id: 'shoes',     name: 'ランニングシューズ', emoji: '👟', price: 150,  desc: '移動速度アップ',       type: 'equip' },
  { id: 'sheep',     name: '羊に変身',           emoji: '🐑', price: 200,  desc: '羊になれる！',         type: 'transform' },
  { id: 'bigBike',   name: '大型バイク',         emoji: '🏍️', price: 300,  desc: 'もっと速い！',         type: 'vehicle' },
  { id: 'boots',     name: 'スーパーブーツ',     emoji: '👢', price: 400,  desc: '蹴りの威力アップ',     type: 'equip' },
  { id: 'sportsCar', name: 'スポーツカー',       emoji: '🚗', price: 500,  desc: 'レースが速くなる',     type: 'vehicle' },
  { id: 'racingCar', name: 'レーシングカー',     emoji: '🏎️', price: 1000, desc: '最速！',               type: 'vehicle' },
];

export const OBSTACLES = [
  { emoji: '🚙', w: 36, h: 46, speed: 2.0, weight: 40 },
  { emoji: '🚕', w: 36, h: 46, speed: 2.5, weight: 30 },
  { emoji: '🚌', w: 46, h: 66, speed: 1.5, weight: 15 },
  { emoji: '🚛', w: 50, h: 70, speed: 1.2, weight: 10 },
  { emoji: '🚓', w: 36, h: 46, speed: 3.5, weight: 5, chase: true },
];

export const TUTORIAL_TEXTS = [
  'このゲームのルールを説明するよ！',
  '① バイクか車を選んでレースしよう！🏁',
  '② 他の車にぶつかるとスタートに戻るよ💥',
  '③ ゴールすると人間に変身！🏃',
  '④ 蹴ってお金を稼ごう！🦶💰',
  '⑤ お金で車やバイクが買えるよ🛒',
  '⑥ 羊にもなれるよ🐑',
  '⑦ でも「あの人」に気をつけて…👤',
];

export const MSG = {
  crash: 'スタートにもどる！💥',
  goal: 'ゴール！人間に変身だ！✨',
  anoHitoComing: '⚠️ あの人がやってきた！',
  anoHitoSays: 'いただきまーす💰',
  anoHitoDefeat: 'あの人を追い払った！💪',
  allTaken: 'みんなは滅びてしまいました…',
  fureFure: 'ふれふれふれふれ',
  recovery: '...そうだ、蹴ればいいんだ！',
  normalClear: 'お金持ちになった最初の人！🏆',
  trueClear: '伝説のドライバー＆キッカー🏆✨',
  secretClear: '伝説の羊 🐑👑',
};
