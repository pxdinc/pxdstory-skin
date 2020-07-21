// @ts-nocheck
function parseDate(s, now) {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const hour = 12
  const min = 0
  const parsers = [
    // 2001.02.03 (금) 오후 4:05
    {
      pattern: /(\d+)\.(\d+)\.(\d+) \(.+\) (.+) (\d+):(\d+)/,
      parser: (m) => new Date(+m[1], +m[2] - 1, +m[3], m[4] === "오후" && +m[5] !== 12 ? +m[5] + 12 : +m[5], +m[6]),
    },
    // 2001.02.03 04:05
    {
      pattern: /(\d+)\.(\d+)\.(\d+) (\d+):(\d+)/,
      parser: (m) => new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]),
    },
    // 2001.02.03
    {
      pattern: /(\d+)\.(\d+)\.(\d+)/,
      parser: (m) => new Date(+m[1], +m[2] - 1, +m[3], hour, min),
    },
    // 04:05:06
    {
      pattern: /([0-9]+):([0-9]+):([0-9]+)/,
      parser: (m) => new Date(year, month - 1, day, +m[1], m[2]),
    },
  ]

  for (let i = 0; i < parsers.length; i++) {
    const m = parsers[i].pattern.exec(s)
    if (m) return parsers[i].parser(m)
  }
  return null
}

function renderDate(d, now) {
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  let hour = d.getHours()
  let min = d.getMinutes()

  const offset = (now - d) / 1000 / 60
  if (offset <= 60) return `${Math.ceil(offset)}분 전`
  if (offset <= 60 * 3) return `${Math.round(offset / 60)}시간 전`

  let ampm = "오전 "
  if (hour >= 12) ampm = "오후 "
  if (hour > 12) hour -= 12
  if (min < 10) min = `0${min}`
  let thetime = `${ampm + hour}:${min}`
  let thedate = `${month - 0}월 ${day - 0}일`

  if (now.getYear() !== d.getYear()) {
    // thedate=year+"년 "+(month-0)+"월 "+(day-0)+"일";
    // thedate="<strong>"+year+"</strong>."+(month-0)+"."+(day-0)+" ("+weekday+")";
    thedate = `${year}년 <span class='dimmed'>${month - 0}월 ${day - 0}일</span>`
  }

  const offday = Math.ceil((offset - (now.getHours() * 60 + now.getMinutes())) / 60 / 24)
  // if(offday<7) thedate=offday+"일 전 "+(month-0)+"월 "+(day-0)+"일 ("+weekday+")";

  if (offday <= 1) {
    if (now.getDate() === d.getDate()) thedate = ""
    // else thedate="어제 ("+weekday+")";
    else thedate = "어제 "
  } else {
    thetime = ""
  }

  return thedate + thetime
}

function smart_date(s, dateObj, testNow) {
  const now = testNow || new Date()
  const d = dateObj || parseDate(s, now)
  if (!d) {
    // unknown pattern
    const thisyear = `${String(now.getFullYear())}.`
    return s.replace(thisyear, "")
  }
  return renderDate(d, now)
}

//   describe('smart_date', () => {
// 	it('2001.02.03 (금) 오후 4:05', () => {
// 	  const actual = smart_date('2001.02.03 (금) 오후 4:05');
// 	  const expected = "2001년 <span class='dimmed'>2월 3일</span>";
// 	  expect(actual).toBe(expected);
// 	});

// 	it('2001.02.03 04:05', () => {
// 	  const actual = smart_date('2001.02.03 04:05');
// 	  const expected = "2001년 <span class='dimmed'>2월 3일</span>";
// 	  expect(actual).toBe(expected);
// 	});

// 	it('2001.02.03', () => {
// 	  const actual = smart_date('2001.02.03');
// 	  const expected = "2001년 <span class='dimmed'>2월 3일</span>";
// 	  expect(actual).toBe(expected);
// 	});

// 	it('1시간 전', () => {
// 	  const now = new Date(2001, 2 - 1, 3, 4, 10, 0);
// 	  const actual = smart_date('2001.02.03 04:05:00', null, now);
// 	  const expected = '5분 전';
// 	  expect(actual).toBe(expected);
// 	});

// 	it('3시간 이내', () => {
// 	  const now = new Date(2001, 2 - 1, 3, 7, 5, 0);
// 	  const actual = smart_date('2001.02.03 04:05:00', null, now);
// 	  const expected = '3시간 전';
// 	  expect(actual).toBe(expected);
// 	});

// 	it('3시간 이상 차이', () => {
// 	  const now = new Date(2001, 2 - 1, 3, 8, 5, 0);
// 	  const actual = smart_date('2001.02.03 04:05:00', null, now);
// 	  const expected = '오전 4:05';
// 	  expect(actual).toBe(expected);
// 	});

// 	it('해가 바뀐 경우', () => {
// 	  const now = new Date(2002, 2 - 1, 3, 4, 5, 0);
// 	  const actual = smart_date('2001.02.03 04:05:00', null, now);
// 	  const expected = "2001년 <span class='dimmed'>2월 3일</span>";
// 	  expect(actual).toBe(expected);
// 	});

// 	it('어제', () => {
// 	  const now = new Date(2001, 2 - 1, 4, 4, 5, 0);
// 	  const actual = smart_date('2001.02.03 04:05:00', null, now);
// 	  const expected = '어제 오전 4:05';
// 	  expect(actual).toBe(expected);
// 	});

// 	it('Unknown', () => {
// 	  const now = new Date(2001, 2 - 1, 3, 4, 5, 0);
// 	  const actual = smart_date('2001.some blah', null, now);
// 	  const expected = 'some blah';
// 	  expect(actual).toBe(expected);
// 	});
//   });
