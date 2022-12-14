/* eslint-disable-next-line import/no-unresolved */
import { ScheduleBuilder } from 'firebase-functions/v1/pubsub';
import { getCookie } from '../modules/address/authentication';
import { getHome } from '../modules/address/home';
import { getAddressSecret, setAddressSecret } from '../modules/firestore';
import { deleteHome, setHome } from '../modules/firestore/cachedAddressHomes';

const MAX_COUNT = 480;

export const crawlAddressHomesHandler: Parameters<ScheduleBuilder['onRun']>[0] = async (context) => {
  const minutes = new Date(context.timestamp).getMinutes();
  const count = Math.floor(MAX_COUNT / 60);
  const baseId = count * minutes + 1;
  const targetIds = [...new Array(count)].map((_, i) => (baseId + i).toString());

  const secret = await getAddressSecret('amon');
  const cookie =
    secret.cookie ||
    (await getCookie(secret).then(async (cookie) => {
      await setAddressSecret('amon', { cookie });
      return cookie;
    }));

  await Promise.all(
    targetIds.map(async (id) => {
      const home = await getHome(id, cookie).catch(() => null);
      home ? await setHome(id, home) : await deleteHome(id);
    })
  );
};
