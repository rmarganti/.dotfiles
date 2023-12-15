// @ts-check

// Name: Emoticons
// Description: Copy the selected emoticon to the keyboard
// Author: Ryan Marganti
// Twitter: @soulsizzledsgn

// Note: Feel free to delete this script!

import '@johnlindquist/kit';
import { Choice } from '@johnlindquist/kit';

type Emote = {
    name: string;
    emote: string;
    category: EmoteCategory;
};

const emoteCategories = ['shruggie', 'tableflip', 'misc'] as const;
type EmoteCategory = (typeof emoteCategories)[number];
type EmoteChoice = Choice<Emote>;

const emotes: Emote[] = [
    // -[ Shruggie ]-----------------------------------
    
    { name: 'Kawaii', emote: '╮ (. ❛ ᴗ ❛.) ╭', category: 'shruggie' },
    { name: 'Dunno man', emote: '┐(´•_•`)┌', category: 'shruggie' },
    { name: 'Donger', emote: '¯\\_( ツ )_/¯', category: 'shruggie' },
    { name: 'Slug', emote: '¯\\_༼ ಥ ‿ ಥ ༽_/¯', category: 'shruggie' },
    { name: 'Big Face', emote: '¯\\_( ⊙_ʖ⊙ )_/¯', category: 'shruggie' },
    { name: 'Confused Sweating', emote: '▔\\▁((.′◔_′◔.))▁/▔', category: 'shruggie' },
    { name: 'Gentleman', emote: '乁( ⁰͡ Ĺ̯ ⁰͡ ) ㄏ', category: 'shruggie' },
    { name: 'Druggie', emote: '¯\\(◉◡◔)/¯', category: 'shruggie' },
    { name: 'Druggie', emote: '¯\\(◉◡◔)/¯', category: 'shruggie' },
    { name: 'No Idea', emote: '╮ (. ❛ ❛ _.) ╭', category: 'shruggie' },


    // -[ Table Flip ]---------------------------------

    { name: 'OG', emote: '(╯°□°）╯︵ ┻━┻', category: 'tableflip' },
    { name: 'Raging', emote: '(ノಠ益ಠ)ノ彡┻━┻', category: 'tableflip' },
    { name: 'Put Back', emote: '┬─┬ノ( º _ ºノ)', category: 'tableflip' },
];

/**
 * Returns a Choice for a random emote from the given category.
 */
const random = (category: EmoteCategory): EmoteChoice => {
    const emotesInCategory = emotes.filter((e) => e.category === category);
    const idx = Math.floor(Math.random() * emotesInCategory.length);

    const emote = emotesInCategory[idx];

    return {
        name: `[${category}] Random`,
        value: emote,
    };
};

const staticChoices: EmoteChoice[] = emotes.map((emote) => ({
    name: `[${emote.category}] ${emote.name} - ${emote.emote}`,
    value: emote,
}));

const choices = [
    ...staticChoices,
    random('shruggie'),
    random('tableflip'),
];

// [ Choose notification ]-------------------------

const choice = await arg('Select a emoticon', choices);
await clipboard.writeText(choice.emote);
