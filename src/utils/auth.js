
import Cookies from 'js-cookie';
import { isPlatform } from '@/utils/settingMer';

const TokenKey = 'Java-platformToken';

export function getToken() {
  return isPlatform ? Cookies.get(TokenKey) : Cookies.get('circleToken');
}

export function setToken(token) {
  if (isPlatform) {
    return Cookies.set(TokenKey, token);
  } else {
    return Cookies.set('circleToken', token);
  }
}

export function removeToken() {
  if (isPlatform) {
    return Cookies.remove(TokenKey);
  } else {
    return Cookies.remove('circleToken');
  }
}
