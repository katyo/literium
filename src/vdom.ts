import { VNode as VNode_, VBaseData, VHooksData, VKey } from 'snabbdom-ng/vnode';
import { VAttrsData } from 'snabbdom-ng/modules/attributes';
import { VPropsData } from 'snabbdom-ng/modules/props';
import { VStyleData } from 'snabbdom-ng/modules/style';
import { VClassData } from 'snabbdom-ng/modules/class';
import { VEventData } from 'snabbdom-ng/modules/eventlisteners';
import { H, h as h_, VNodeChildren as VNodeChildren_, } from 'snabbdom-ng/h';

export interface VData extends VBaseData, VHooksData<VData>, VAttrsData, VPropsData, VClassData, VStyleData, VEventData { }

export const h: H<VData> = h_;
export type VNode = VNode_<VData>;
export type VNodes = VNodeChildren_<VData>;
export { VKey };
