"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrimaryAgentRunTurn = void 0;
const client_1 = require("../../../../../../generated/prisma/client");
async function createPrimaryAgentRunTurn(prisma, input) {
    return prisma.$transaction(async (tx) => {
        const turn = await tx.messageTurn.create({
            data: {
                messageId: input.messageId,
                sessionId: input.sessionId,
                userId: input.userId,
                appClientId: input.appClientId,
                userInput: input.userInput,
                primaryAgentId: input.agentId,
                agentRunCount: 1,
                status: client_1.AgentRunStatus.running,
                startedAt: input.startedAt,
            },
        });
        const run = await tx.agentRun.create({
            data: {
                turnId: turn.id,
                agentId: input.agentId,
                appClientId: input.appClientId,
                sessionId: input.sessionId,
                userId: input.userId,
                role: client_1.AgentRunRole.primary,
                sequence: 1,
                input: input.userInput,
                status: client_1.AgentRunStatus.running,
                steps: [],
                currentStep: 0,
                maxSteps: input.maxSteps,
                startedAt: input.startedAt,
            },
        });
        return { turn, run };
    });
}
exports.createPrimaryAgentRunTurn = createPrimaryAgentRunTurn;
//# sourceMappingURL=create-primary-agent-run.util.js.map