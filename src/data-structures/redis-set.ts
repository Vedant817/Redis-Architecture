export class RedisSet {
    private members = new Set<string>();

    public add(...members: string[]): number {
        let added: number = 0;
        for(const member of members){
            if(!this.members.has(member)){
                this.members.add(member);
                added++;
            }
        }

        return added;
    }

    public remove(...members: string[]): number {
        let removed: number = 0;
        for(const member of members){
            if(this.members.has(member)){
                this.members.delete(member);
                removed++;
            }
        }

        return removed;
    }

    public allMembers(): string[] {
        return Array.from(this.members);
    }

    public isMember(member: string): boolean {
        return this.members.has(member);
    }

    public cardinality(): number {
        return this.members.size;
    }

    public pop(count = 1): string[]{ //! Remove and return random member
        const result: string[] = [];
        const memberArray = Array.from(this.members);

        for(let i = 0; i < count && memberArray.length > 0; i++){
            const randomIndex = Math.floor(Math.random() * memberArray.length);
            const member = memberArray[randomIndex];
            this.members.delete(member);
            result.push(member);
        }

        return result;
    }

    public randomMember(count = 1): string[]{
        const memberArray = Array.from(this.members);
        const result: string[] = [];

        if(count >= 0){
            const indices = new Set<number>();
            while(indices.size < Math.min(count, memberArray.length)){
                indices.add(Math.floor(Math.random() * memberArray.length));
            }

            for(const index of indices){
                result.push(memberArray[index])
            }
        } else {
            for(let i = 0; i < Math.abs(count); i++){
                if(memberArray.length === 0) break;
                const randomIndex = Math.floor(Math.random() * memberArray.length);
                result.push(memberArray[randomIndex]);
            }
        }

        return result;
    }

    public union(...otherSets: RedisSet[]): RedisSet {
        const resultSet = new RedisSet();
        for(const member of this.members){
            resultSet.add(member);
        }

        for(const otherSet of otherSets){
            for(const member of otherSet.allMembers()){
                resultSet.add(member);
            }
        }

        return resultSet;
    }

    public intersection(...otherSets: RedisSet[]): RedisSet {
        const resultSet = new RedisSet();

        if(otherSets.length === 0){
            // Return a copy of the current set if no other sets are provided
            for(const member of this.members){
                resultSet.add(member);
            }
        }

        for(const member of this.members){
            let isInAll = true;
            for(const otherSet of otherSets){
                if(!otherSet.isMember(member)){
                    isInAll = false;
                    break;
                }
            }

            if(isInAll){
                resultSet.add(member);
            }
        }

        return resultSet;
    }

    public difference(...otherSets: RedisSet[]): RedisSet {
        const resultSet = new RedisSet();

        for(const member of this.members){
            let isInAny = false;
            for(const otherSet of otherSets){
                if(otherSet.isMember(member)){
                    isInAny = true;
                    break;
                }
            }

            if(!isInAny){
                resultSet.add(member);
            }
        }

        return resultSet;
    }

    public getMemoryUsage(): number {
        let size = 64 //? Base set size
        for(const member of this.members){
            size += member.length * 2 + 24
        }

        return size;
    }
}