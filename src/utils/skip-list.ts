//! Redis uses this for the sorted lists - Provides O(log n) search, insert and deletion
//! For maintaining members ordered by their scores and supporting range queries.

interface SkipListNode {
    member: string;
    score: number;
    forward: (SkipListNode | null)[];
    backward: SkipListNode | null;
    span: number[]; //? Number of elements between this node and the next node at each level
}

interface SkipListLevel {
    forward: SkipListNode | null;
    span: number;
}

export class SkipList {
    private header: SkipListNode;
    private tail: SkipListNode | null = null;
    private length = 0;
    private level = 1;
    private readonly maxLevel: number = 32;
    private readonly probability: number = 0.25 //? Probability of promoting a node to the next level

    constructor() {
        this.header = {
            member: '',
            score: Number.NEGATIVE_INFINITY,
            forward: Array(this.maxLevel).fill(null),
            backward: null,
            span: Array(this.maxLevel).fill(0)
        };
    }

    private randomLevel(): number { //? Generating a random level for the new node
        let level = 1;
        while (Math.random() < this.probability && level < this.maxLevel) {
            level++;
        }
        return level;
    }

    public insert(score: number, member: string): boolean {
        const update: SkipListNode[] = new Array(this.maxLevel);
        const rank: number[] = new Array(this.maxLevel);
        let current = this.header;

        for (let i = this.level - 1; i >= 0; i--) { //! Finding the insertion point and updating the rank
            rank[i] = i === this.level - 1 ? 0 : rank[i + 1];

            while (current.forward[i] && (current.forward[i]!.score < score || (current.forward[i]!.score === score && current.forward[i]!.member < member))) {
                rank[i] += current.span[i];
                current = current.forward[i]!;
            }
            update[i] = current;
        }

        current = current.forward[0]!;
        if (current && current.score === score && current.member === member) { //? Checking if the member already exists with the same score
            return false;
        }

        const newLevel = this.randomLevel();
        if (newLevel > this.level) {
            for (let i = this.level; i < newLevel; i++) {
                rank[i] = 0;
                update[i] = this.header;
                update[i].span[i] = this.length;
            }
            this.level = newLevel;
        }

        const newNode: SkipListNode = {
            member,
            score,
            forward: new Array(this.maxLevel).fill(null),
            backward: null,
            span: new Array(this.maxLevel).fill(0)
        };

        for (let i = 0; i < newLevel; i++) { //? Updating the forward pointer and the spans
            newNode.forward[i] = update[i].forward[i];
            update[i].forward[i] = newNode;

            newNode.span[i] = update[i].span[i] - (rank[0] - rank[i]);
            update[i].span[i] = (rank[0] - rank[i]) + 1;
        }

        for (let i = newLevel; i < this.level; i++) {
            update[i].span[i] += 1; //? Incrementing the span for the levels above the new node
        }

        newNode.backward = update[0] === this.header ? null : update[0];
        if (newNode.forward[0]) {
            newNode.forward[0]!.backward = newNode; //* Setting up the back pointer for the forward node
        } else {
            this.tail = newNode;
        }

        this.length++;
        return true;
    }

    public deleteMember(score: number, member: string): boolean {
        const update: SkipListNode[] = new Array(this.maxLevel);
        let current = this.header;

        for (let i = this.level - 1; i >= 0; i--) {
            while (current.forward[i] && (current.forward[i]!.score < score || (current.forward[i]!.score === score && current.forward[i]!.member < member))) {
                current = current.forward[i]!;
            }
            update[i] = current;
        }
        current = current.forward[0]!;
        if (!current || current.score !== score || current.member !== member) {
            return false;
        }

        this.deleteNode(current, update);
        return true;
    }

    private deleteNode(node: SkipListNode, update: SkipListNode[]): void {
        for (let i = 0; i < this.level; i++) {
            if (update[i].forward[i] === node) {
                update[i].span[i] += node.span[i] - 1;
                update[i].forward[i] = node.forward[i];
            } else {
                update[i].span[i]--;
            }
        }

        if (node.forward[0]) {
            node.forward[0]!.backward = node.backward;
        } else {
            this.tail = node.backward;
        }

        while (this.level > 1 && !this.header.forward[this.level - 1]) {
            this.level--;
        }
        this.length--;
    }

    public getRank(score: number, member: string): number | null {
        let rank = 0;
        let current = this.header;

        for (let i = this.level - 1; i >= 0; i--) {
            while (current.forward[i] && (current.forward[i]!.score < score || (current.forward[i]!.score === score && current.forward[i]!.member < member))) {
                rank += current.span[i];
                current = current.forward[i]!;
            }

            if (current.member === member && current.score === score) {
                return rank - 1;
            }
        }
        return null;
    }

    public getByRank(rank: number): SkipListNode | null {
        if (rank < 0 || rank >= this.length) return null;
        let traversed = 0;
        let current = this.header;

        for (let i = this.level - 1; i >= 0; i--) {
            while (current.forward[i] && traversed + current.span[i] <= rank + 1) {
                traversed += current.span[i];
                current = current.forward[i]!;
            }

            if (traversed === rank + 1) return current;
        }

        return null;
    }

    public getRangeByRank(start: number, stop: number, withScores = false): string[] {
        if (start < 0) start = Math.max(0, this.length + start);
        if (stop < 0) stop = this.length + stop;

        if (start > stop || start >= this.length) return [];

        const result: string[] = [];
        let current = this.getByRank(start);
        let count = 0;

        while (current && start + count <= stop) {
            if (withScores) {
                result.push(current.member, current.score.toString());
            } else {
                result.push(current.member);
            }
            current = current.forward[0];
            count++;
        }

        return result;
    }

    public getRangeByScore(min: number, max: number, withScores = false): string[] {
        const result: string[] = [];
        let current = this.header.forward[0];

        //? Skip to first node with score >= min
        while (current && current.score < min) {
            current = current.forward[0];
        }

        //? Collect nodes within range
        while (current && current.score <= max) {
            if (withScores) {
                result.push(current.member, current.score.toString());
            } else {
                result.push(current.member);
            }
            current = current.forward[0];
        }

        return result;
    }

    public getScore(member: string): number | null {
        let current = this.header.forward[0];

        while (current) {
            if (current.member === member) {
                return current.score;
            }
            current = current.forward[0];
        }

        return null;
    }

    public countByScore(min: number, max: number): number {
        let count = 0;
        let current = this.header.forward[0];

        while (current && current.score < min) {
            current = current.forward[0];
        }

        while (current && current.score <= max) {
            count++;
            current = current.forward[0];
        }

        return count;
    }

    public getLength(): number {
        return this.length;
    }

    public debug(): void {
        for (let level = this.level - 1; level >= 0; level--) {
            let current = this.header;
            let output = `Level ${level}: `;

            while (current.forward[level]) {
                current = current.forward[level]!;
                output += `[${current.member}:${current.score}] `;
            }
            console.log(output)
        }
    }
}