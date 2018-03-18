import {
    VNode as VNode_, VNodeChild as VNodeChild_, VBaseData, VHooksData, VKey,
    H, h as h_, VNodeChildren as VNodeChildren_,
    VAttrsData, VPropsData, VStyleData, VClassData, VEventData
} from 'snabbdom-ng';

export interface VData extends VBaseData, VHooksData<VData>, VAttrsData, VPropsData, VClassData, VStyleData, VEventData { }

export const h: H<VData> = h_;
export type VNode = VNode_<VData>;
export type VNodeChild = VNodeChild_<VData>;
export type VNodeChildren = VNodeChildren_<VData>;
export { VKey };
