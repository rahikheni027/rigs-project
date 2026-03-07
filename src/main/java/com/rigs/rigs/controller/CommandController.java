package com.rigs.rigs.controller;

import com.rigs.rigs.dto.CommandRequest;
import com.rigs.rigs.dto.CommandResponse;
import com.rigs.rigs.entity.Command;
import com.rigs.rigs.service.CommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/commands")
@RequiredArgsConstructor
@Slf4j
public class CommandController {

    private final CommandService commandService;

    @PostMapping
    public ResponseEntity<CommandResponse> sendCommand(
            @RequestBody CommandRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String issuedBy = userDetails.getUsername();
        Command cmd = commandService.issueCommand(request.getMachineId(), request.getCommandType(),
                request.getParameters(), issuedBy);

        return ResponseEntity.ok(CommandResponse.builder()
                .id(cmd.getId())
                .machineId(cmd.getMachine().getId())
                .commandType(cmd.getCommandType())
                .status(cmd.getStatus())
                .issuedBy(cmd.getIssuedBy())
                .issuedAt(cmd.getIssuedAt())
                .build());
    }
}
