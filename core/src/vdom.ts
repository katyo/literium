import {
    VNode as VNode_, VNodeChild as VNodeChild_, VBaseData, VHooksData, VKey,
    H, h as h_, VNodeChildren as VNodeChildren_, emptyVData,
    VAttrsData, VPropsData, VStyleData, VClassData, VEventData
} from 'snabbdom-ng';

export interface VData extends VBaseData, VHooksData<VData>, VAttrsData, VPropsData, VClassData, VStyleData, VEventData<VData> { }

export const h: H<VData> = h_;
export type VNode = VNode_<VData>;
export type VNodeChild = VNodeChild_<VData>;
export type VNodeChildren = VNodeChildren_<VData>;
export { VKey };

export const empty: VData = emptyVData;

export function with_key(key: VKey, vnode: VNodeChild): VNodeChild {
    if (vnode != null && typeof vnode == 'object' && vnode.sel) {
        vnode.key = key;
    }
    return vnode;
}
