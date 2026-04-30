MAP_NODE_BASE_SIZE EQU 64
MAP_TABLE_OFF      EQU 32 
MAP_TABLE_SIZE_OFF EQU 40  
MAP_MODE_OFF       EQU 48 
MAP_XCOL_OFF       EQU 52
MAP_YCOL_OFF       EQU 60 
MAP_CACHE_MAIN_OFF EQU 68  
MAP_CACHE_UNM_OFF  EQU 76 
MAP_CACHE_LEN_OFF  EQU 84 

MAP_TYPE EQU 3

RULE_SIZE EQU 16
RULE_X_OFF EQU 0   ; double X
RULE_Y_OFF EQU 8   ; double Y

map_add_rule:
    push rbp
    mov rbp, rsp
    push rbx
    mov rbx, rdi                   
    mov r8, [rbx + MAP_TABLE_OFF]  
    mov rcx, [rbx + MAP_TABLE_SIZE_OFF]
    mov rdi, rcx
    inc rdi
    shl rdi, 4                       ; *16
    call malloc
    test rax, rax
    jz .fail
    mov rsi, r8
    mov rdi, rax
    mov rcx, [rbx + MAP_TABLE_SIZE_OFF]
    shl rcx, 4
    rep movsb
    mov rsi, rax
    mov rcx, [rbx + MAP_TABLE_SIZE_OFF]
    lea rsi, [rsi + rcx*8]        
    shl rcx, 4
    add rsi, rcx
    movsd qword [rsi + RULE_X_OFF], xmm0    ; xmm0 = x
    movsd qword [rsi + RULE_Y_OFF], xmm1    ; xmm1 = y
    mov [rbx + MAP_TABLE_OFF], rax
    inc qword [rbx + MAP_TABLE_SIZE_OFF]
    test r8, r8
    jz .skip_free
    mov rdi, r8
    call free
.skip_free:
    call map_invalidate_cache
    TRIGGER_DEPENDENTS rbx
.fail:
    pop rbx
    pop rbp
    ret

map_set_mode:
    cmp rsi, 0
    je .set0
    cmp rsi, 1
    je .set1
    ret
.set0:
    mov byte [rdi + MAP_MODE_OFF], 0
    jmp .done
.set1:
    mov byte [rdi + MAP_MODE_OFF], 1
.done:
    call map_invalidate_cache
    TRIGGER_DEPENDENTS rdi
    ret

map_lookup:
    push rbp
    mov rbp, rsp
    push rbx
    mov rbx, rdi                     ; node
    mov r8, [rbx + MAP_TABLE_OFF]
    mov rcx, [rbx + MAP_TABLE_SIZE_OFF]
    xor rbx, rbx               
.loop:
    cmp rbx, rcx
    jge .not_found
    movsd xmm1, qword [r8 + rbx*16 + RULE_X_OFF]  
    comisd xmm0, xmm1
    je .found         
    inc rbx
    jmp .loop
.found:
    movsd xmm0, qword [r8 + rbx*16 + RULE_Y_OFF]
    test rax, rax                    
    jmp .done
.not_found:
    xor eax, eax
    cmp eax, 1                       
    ; (ZF=0)
.done:
    pop rbx
    pop rbp
    ret

map_invalidate_cache:
    push rbp
    mov rbp, rsp
    mov rsi, [rdi + MAP_CACHE_MAIN_OFF]
    test rsi, rsi
    jz .skip_main
    call free
    mov qword [rdi + MAP_CACHE_MAIN_OFF], 0
.skip_main:
    mov rsi, [rdi + MAP_CACHE_UNM_OFF]
    test rsi, rsi
    jz .skip_unm
    call free
    mov qword [rdi + MAP_CACHE_UNM_OFF], 0
.skip_unm:
    mov qword [rdi + MAP_CACHE_LEN_OFF], 0
    pop rbp
    ret
    
map_compute_outputs:
    push rbp
    mov rbp, rsp
    push rbx
    push r12
    push r13
    push r14
    call map_fetch_input          ; RAX = double* input, RCX = input_len
    test rcx, rcx
    jz .no_input
    mov rbx, rdi                  ; node
    call map_invalidate_cache     
    mov r14, [rbx + MAP_MODE_OFF]
    xor r12, r12                  
    xor r13, r13              
    mov rsi, rax         
    mov rcx, rcx         
    mov r8, rsi
    mov r9, rcx
.count_loop:
    test rcx, rcx
    jz .alloc
    movsd xmm0, qword [r8]
    call map_lookup               
    je .found_in_main
    cmp r14, 0                
    je .passthrough_to_main
    inc r13
    jmp .next
.passthrough_to_main:
    inc r12
    jmp .next
.found_in_main:
    inc r12
.next:
    add r8, 8
    dec rcx
    jmp .count_loop

.alloc:
    mov rcx, r12
    shl rcx, 3
    call malloc
    mov [rbx + MAP_CACHE_MAIN_OFF], rax
    mov r8, rax                 
    cmp r14, 1
    jne .fill_main
    mov rcx, r13
    shl rcx, 3
    call malloc
    mov [rbx + MAP_CACHE_UNM_OFF], rax
    mov r9, rax                  
.fill_main:
    call map_fetch_input          ; RAX = input, RCX = len
    mov rdi, rbx                 
    mov r10, rax                  ; input ptr
    mov r11, rcx                  ; input len
    xor r12, r12                  
    xor r13, r13    
    
.fill_loop:
    test r11, r11
    jz .done
    movsd xmm0, qword [r10]
    call map_lookup
    je .found
    cmp r14, 0
    je .passthru
    mov rsi, [rbx + MAP_CACHE_UNM_OFF]
    lea rsi, [rsi + r13*8]
    movsd qword [rsi], xmm0
    inc r13
    jmp .next_elem
.passthru:
    mov rsi, [rbx + MAP_CACHE_MAIN_OFF]
    lea rsi, [rsi + r12*8]
    movsd qword [rsi], xmm0
    inc r12
    jmp .next_elem
.found:
    mov rsi, [rbx + MAP_CACHE_MAIN_OFF]
    lea rsi, [rsi + r12*8]
    movsd qword [rsi], xmm0 
    inc r12
.next_elem:
    add r10, 8
    dec r11
    jmp .fill_loop
.done:
    mov [rbx + MAP_CACHE_LEN_OFF], r12
    jmp .finish
.no_input:
    mov qword [rbx + MAP_CACHE_MAIN_OFF], 0
    mov qword [rbx + MAP_CACHE_UNM_OFF], 0
    mov qword [rbx + MAP_CACHE_LEN_OFF], 0
.finish:
    pop r14
    pop r13
    pop r12
    pop rbx
    pop rbp
    ret

map_read_output_main:
    cmp byte [rdi + DIRTY_FLAG_OFF], 0
    je .cached
    call map_compute_outputs
    mov byte [rdi + DIRTY_FLAG_OFF], 0
.cached:
    mov rax, [rdi + MAP_CACHE_MAIN_OFF]
    mov rcx, [rdi + MAP_CACHE_LEN_OFF]
    ret

map_read_output_unmapped:
    cmp byte [rdi + DIRTY_FLAG_OFF], 0
    je .cached
    call map_compute_outputs
    mov byte [rdi + DIRTY_FLAG_OFF], 0
.cached:
    mov rax, [rdi + MAP_CACHE_UNM_OFF]
    mov rcx, [rdi + MAP_CACHE_LEN_OFF]
    cmp byte [rdi + MAP_MODE_OFF], 0
    je .passthrough
    ret
.passthrough:
    xor rax, rax
    xor rcx, rcx
    ret
