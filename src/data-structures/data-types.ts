export enum RedisDataType {
    STRING = 'string',
    LIST = 'list', //? Linked List
    HASH = 'hash', //? Key-Value Pair
    SET = 'set', //? Unordered Set
    SORTED_SET = 'zset', //? Values with a score for ordering
    STREAM = 'stream' //? Append Only log like structure
}

export interface RedisValue { //! Represents a single key’s value inside Redis. (Entry)
    type: RedisDataType;
    value: "any";
    ttl?: number; //? Time to live in milliseconds
    lastAccessed?: number;
    createdAt: number
}

export interface RedisDatabase {
    data: Map<string, RedisValue>;
    expires: Map<string, number>; //? Expiration Timestamps
    keyspace: number; //? Database Number
}

export interface StreamEntry {
    id: string;
    fields: Map<string, string>;
}

export interface StreamConsumerGroup {
    name: string;
    lastDeliveredId: string;
    consumer: Map<string, StreamConsumer>;
    pending: Map<string, PendingMessage> //? Messages waiting to be acknowledged
}

export interface StreamConsumer {
    name: string;
    lastSeen: number; //? Timestamp when last active
    pendingCount: number; //? Number of messages  pending for this consumer.
}

export interface PendingMessage {
    id: string;
    consumer: string;
    deliveryTime: number;
    deliveryCount: number
}