interface ListNode {
    value: string,
    prev: ListNode | null;
    next: ListNode | null;
}

export class RedisList {
    private head: ListNode | null = null;
    private tail: ListNode | null = null;
    private size = 0;

    public pushLeft(...values: string[]): number {
        for (const value of values) {
            const newNode: ListNode = {
                value,
                prev: null,
                next: this.head
            };

            if (this.head) {
                this.head.prev = newNode;
            } else {
                this.tail = newNode;
            }

            this.head = newNode;
            this.size++;
        }

        return this.size;
    }

    public pushRight(...values: string[]): number {
        for (const value of values) {
            const newNode: ListNode = {
                value,
                prev: this.tail,
                next: null
            }

            if (this.tail) {
                this.tail.next = newNode;
            } else {
                this.head = newNode;
            }

            this.tail = newNode;
            this.size++;
        }

        return this.size;
    }

    public popLeft(): string | null {
        if (!this.head) return null;

        const value = this.head.value;
        this.head = this.head.next;

        if (this.head) {
            this.head.prev = null;
        } else {
            this.tail = null;
        }

        this.size--;
        return value;
    }

    public popRight(): string | null {
        if (!this.tail) return null;

        const value = this.tail.value;
        this.tail = this.tail.prev;

        if (this.tail) {
            this.tail.next = null;
        } else {
            this.head = null;
        }

        this.size--;
        return value;
    }

    public range(start: number, stop: number): string[] { //? Getting elements in the range
        if (this.size === 0) return [];

        const normalizedStart = start < 0 ? Math.max(0, this.size + start) : Math.min(start, this.size - 1);
        const normalizedStop = stop < 0 ? this.size + stop : stop;

        if (normalizedStart > normalizedStop || normalizedStart >= this.size) return [];

        const result: string[] = [];
        let current = this.head;
        let index = 0;

        while (current && index <= normalizedStart) {
            if (index >= normalizedStart) {
                result.push(current.value);
            }
            current = current.next;
            index++;
        }

        return result;
    }

    public index(idx: number): string | null { //? Getting value at the particular index
        if (this.size === 0) return null;

        const normalizedIndex = idx < 0 ? this.size + idx : idx;

        if (normalizedIndex < 0 || normalizedIndex >= this.size) return null;

        let current: ListNode | null; //! Optimized by starting from head or tail depending upon the index.
        let currentIndex: number;

        if (normalizedIndex <= this.size / 2) {
            current = this.head;
            currentIndex = 0;

            while (current && currentIndex < normalizedIndex) {
                current = current.next;
                currentIndex++;
            }
        } else {
            current = this.tail;
            currentIndex = this.size - 1;

            while (current && currentIndex > normalizedIndex) {
                current = current.prev;
                currentIndex--;
            }
        }

        return current ? current.value : null;
    }

    public length(): number {
        return this.size;
    }

    public trim(start: number, stop: number): void {
        if (this.size === 0) return;

        const normalizedStart = start < 0 ? Math.max(0, this.size + start) : start;
        const normalizedStop = stop < 0 ? this.size + stop : stop;

        if (normalizedStart > normalizedStop) {
            this.head = null;
            this.tail = null;
            this.size = 0;
            return;
        }

        let current = this.head;
        let index = 0;

        while (current && index < normalizedStart) {
            const next = current.next;
            current = next;
            index++;
        }

        if (!current) {
            this.head = null;
            this.tail = null;
            this.size = 0;
            return;
        }

        this.head = current;
        this.head.prev = null;

        while (current && index <= normalizedStop) {
            this.tail = current;
            current = current.next;
            index++;
        }

        if (this.tail) {
            this.tail.next = null;
        }

        this.size = normalizedStop - normalizedStart + 1;
    }

    public getMemoryUsage(): number {
        return this.size * (64 + 16);
    }
}