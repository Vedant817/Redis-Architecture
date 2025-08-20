export class RedisHash {
    private fields = new Map<string, string>();

    public set(field: string, value: string): number {
        const isNew = !this.fields.has(field);
        this.fields.set(field, value);

        return isNew ? 1 : 0;
    }

    public get(field: string): string | null {
        return this.fields.get(field) ?? null;
    }

    public getAll(): Record<string, string> {
        const result: Record<string, string> = {};
        for(const [field, value] of this.fields){
            result[field] = value;
        }

        return result;
    }

    public delete(...fields: string[]): number {
        let deleteCount: number = 0;

        for(const field of fields){
            if(this.fields.delete(field)){
                deleteCount++;
            }
        }

        return deleteCount;
    }

    public exists(field: string): boolean {
        return this.fields.has(field)
    }

    public keys(): string[]{
        return Array.from(this.fields.keys())
    }

    public values(): string[] {
        return Array.from(this.fields.values());
    }

    public length(): number {
        return this.fields.size;
    }

    public incrementBy(field: string, increment: number): number { //! Increment field by integer value
        const current = parseInt(this.fields.get(field) || '0');
        if(isNaN(current)) throw new Error('ERR value is not an integer');

        const newValue = current + increment;
        this.fields.set(field, newValue.toString());
        return newValue;
    }

    public incrementByFloat(field: string, increment: number): number {
        const current = parseFloat(this.fields.get(field ) || '0');
        if(isNaN(current)) throw new Error('ERR value is not a float');

        const newValue = current + increment;
        this.fields.set(field, newValue.toString());

        return newValue;
    }

    public getMemoryUsage(): number {
        let size = 64;
        for(const [field, value] of this.fields){
            size += field.length * 2 + value.length * 2 + 32;
        }

        return size;
    }
}