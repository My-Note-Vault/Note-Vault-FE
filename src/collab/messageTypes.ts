/** custom outer envelope: 첫 varUint로 메시지 종류 구분 */
export const MSG_SYNC = 0;
export const MSG_AWARENESS = 1;
export const MSG_BOOTSTRAP_COMPLETE = 2;
export const MSG_DOCUMENT_UPDATE = 3;
export const MSG_UPDATE_ACK = 4;
export const MSG_SEARCH_PROJECTION = 5;
export const MSG_CRDT_SYNC_REQUEST = 6;
export const MSG_CRDT_SNAPSHOT = 7;
export const MSG_DOCUMENT_UPDATE_WITH_ACTIVITY = 8;
