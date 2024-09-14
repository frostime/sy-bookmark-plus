export const formatItemTitle = (block: Block) => {
    const { name, fcontent, content } = block;

    if (block.type === 'av') {
        return name || block.content.split(' ')[0];
    }
    return name || fcontent || content;
}