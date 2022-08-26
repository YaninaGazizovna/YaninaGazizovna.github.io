import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const getRandomInteger = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  if (min < 0 || max < min) {
    return;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function getMixArray(array) {
  const arrayNew = array.map((index) => [Math.random(), index]);
  const arraySort = arrayNew.sort();
  const arrayMixed = arraySort.map((index) => index[1]);
  const arrayMixLength = arrayMixed.splice(
    getRandomInteger(0, array.length - 1)
  );

  return arrayMixLength;
}

const humanizeDate = (dueDate) => dayjs(dueDate).format('DD/MM/YY H:MM');
const humanizeHour = (dueDate) => dayjs(dueDate).format(' HH:MM');
const humanizeStartDate = (dueDate) => dayjs(dueDate).format('MMMM DD');
const formatHoursMinutes = (minutes) =>
  dayjs.duration(minutes, 'minutes').format('H[H] mm[MM]');
const differenceMinutes = (dateFrom, dateTo) =>
  dayjs(dateTo).diff(dayjs(dateFrom), 'minute');

const isFuture = (dueDate) => dueDate && dayjs().isBefore(dueDate, 'D');
const isPast = (dueDate) => dueDate && dayjs().isAfter(dueDate, 'D');
const isSame = (dueDate) => dueDate && dayjs(dueDate).isSame(dayjs(), 'D');

const updateItem = (items, update) => {
  const index = items.findIndex((item) => item.id === update.id);

  if (index === -1) {
    return items;
  }

  return [
    ...items.slice(0, index),
    update,
    ...items.slice(index + 1),
  ];
};

export {
  getRandomInteger,
  getMixArray,
  humanizeDate,
  humanizeHour,
  isSame,
  isFuture,
  isPast,
  humanizeStartDate,
  differenceMinutes,
  formatHoursMinutes,
  updateItem,
};
